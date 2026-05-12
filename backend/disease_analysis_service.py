from __future__ import annotations

import hashlib
import json
import logging
import os
from dataclasses import dataclass
from io import BytesIO
from typing import Any

import numpy as np
import torch
from PIL import Image, ImageOps, UnidentifiedImageError
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

try:
    from .llm_memory import get_vectorstore
except ImportError:  # pragma: no cover
    from llm_memory import get_vectorstore


logger = logging.getLogger("agrisense.disease")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_IMAGE_SIZE_MB = float(os.getenv("AGRI_MAX_IMAGE_SIZE_MB", "10"))
DEFAULT_IMAGE_MODEL = os.getenv("GROQ_DISEASE_MODEL", os.getenv("GROQ_MODEL", "llama3-70b-8192"))
DEFAULT_IMAGE_TEMPERATURE = float(os.getenv("GROQ_DISEASE_TEMPERATURE", os.getenv("GROQ_TEMPERATURE", "0.2")))
DEFAULT_TOP_K = int(os.getenv("RAG_TOP_K", "4"))


class AgriSenseError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass(frozen=True)
class DiseasePrediction:
    crop: str
    disease: str
    confidence: int
    severity: str


MOCK_PREDICTIONS: list[DiseasePrediction] = [
    DiseasePrediction(crop="Tomato", disease="Early Blight", confidence=92, severity="Medium"),
    DiseasePrediction(crop="Potato", disease="Late Blight", confidence=90, severity="High"),
    DiseasePrediction(crop="Corn", disease="Leaf Rust", confidence=88, severity="Medium"),
    DiseasePrediction(crop="Chili", disease="Bacterial Spot", confidence=87, severity="Medium"),
    DiseasePrediction(crop="Rice", disease="Brown Spot", confidence=91, severity="Low"),
]


SYSTEM_PROMPT = """
You are AgriSense, a practical farm advisor for crop disease problems.

Write advice in simple language that a farmer can act on immediately.
Avoid jargon, long explanations, and bullet points inside strings.

Return valid JSON only with these keys:
- disease_explanation: one short paragraph explaining the problem
- cause: one short paragraph describing the likely cause
- treatment: array of short, practical treatment steps
- prevention: array of short, practical prevention steps
- organic_solution: array of short, practical organic options

Use the retrieved context when it is helpful, but keep the answer concise and farmer-friendly.
""".strip()


def _get_api_key() -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise AgriSenseError("GROQ_API_KEY is missing. Add it to backend/.env.", status_code=500)
    return api_key


def _normalize_filename(filename: str | None) -> str:
    return (filename or "").strip().lower()


def _validate_image_upload(image_bytes: bytes, filename: str | None, content_type: str | None) -> None:
    if not image_bytes:
        raise AgriSenseError("Uploaded image is empty.")

    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        raise AgriSenseError(f"Image is too large. Limit is {MAX_IMAGE_SIZE_MB:g} MB.")

    extension = os.path.splitext(filename or "")[1].lower()
    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise AgriSenseError("Only JPG, JPEG, and PNG images are allowed.")
    if extension and extension not in ALLOWED_EXTENSIONS:
        raise AgriSenseError("Only JPG, JPEG, and PNG images are allowed.")


def _load_image(image_bytes: bytes) -> Image.Image:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            return ImageOps.exif_transpose(image).convert("RGB")
    except UnidentifiedImageError as error:
        raise AgriSenseError("The uploaded file is not a valid image.") from error
    except Exception as error:
        raise AgriSenseError(f"Unable to read the uploaded image: {error}") from error


def _preprocess_image(image: Image.Image) -> torch.Tensor:
    # Real model integration point: feed this tensor to a trained PyTorch or YOLOv8 model later.
    resized = image.resize((224, 224))
    pixel_data = np.asarray(resized, dtype=np.float32) / 255.0
    tensor = torch.from_numpy(pixel_data).permute(2, 0, 1).unsqueeze(0)
    return tensor.contiguous()


def _mock_predict(image_bytes: bytes, filename: str | None) -> DiseasePrediction:
    lowered_name = _normalize_filename(filename)
    if "tomato" in lowered_name:
        return MOCK_PREDICTIONS[0]

    digest = hashlib.sha256(image_bytes).digest()
    return MOCK_PREDICTIONS[digest[0] % len(MOCK_PREDICTIONS)]


def _format_document_context(documents: list[Any]) -> str:
    if not documents:
        return "No related agricultural documents were found."

    pieces: list[str] = []
    for document in documents:
        metadata = getattr(document, "metadata", {}) or {}
        source = metadata.get("source") or metadata.get("filename") or "unknown"
        page = metadata.get("page")
        excerpt = getattr(document, "page_content", "")[:700].strip()
        location = f"{source}" if page is None else f"{source} (page {page})"
        pieces.append(f"{location}: {excerpt}")

    return "\n\n".join(pieces)


def _get_llm() -> ChatGroq:
    return ChatGroq(
        model_name=DEFAULT_IMAGE_MODEL,
        api_key=_get_api_key(),
        temperature=DEFAULT_IMAGE_TEMPERATURE,
    )


def _get_retrieved_context(query: str) -> str:
    try:
        vectorstore = get_vectorstore()
        documents = vectorstore.similarity_search(query, k=DEFAULT_TOP_K)
        return _format_document_context(documents)
    except FileNotFoundError:
        logger.warning("No PDF knowledge base found; continuing without RAG context")
        return "No PDF knowledge base is currently available."
    except Exception as error:  # pragma: no cover
        logger.exception("RAG retrieval failed: %s", error)
        return "RAG retrieval failed, so provide safe general farming advice."


def _fallback_advice(prediction: DiseasePrediction) -> dict[str, Any]:
    return {
        "disease_explanation": f"The image looks like {prediction.disease} on {prediction.crop}. Act early to reduce spread.",
        "cause": "This is often linked to humid weather, infected crop residue, weak plant spacing, or splash from rain and irrigation.",
        "treatment": [
            "Remove badly affected leaves or fruits and destroy them away from the field.",
            "Improve air flow by spacing plants well and avoiding overhead watering.",
            "Use a recommended fungicide or crop-specific spray only if it matches local guidance.",
        ],
        "prevention": [
            "Rotate crops and avoid planting the same crop in the same area repeatedly.",
            "Keep the field clean and remove infected plant debris.",
            "Inspect plants regularly so symptoms are caught early.",
        ],
        "organic_solution": [
            "Spray neem-based products if they are approved for the crop and disease.",
            "Use compost tea or bio-fungicide only as part of a wider disease-management plan.",
            "Apply mulch to reduce soil splash onto leaves.",
        ],
    }


def _parse_llm_json(response_text: str, prediction: DiseasePrediction) -> dict[str, Any]:
    try:
        parsed = json.loads(response_text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = response_text.find("{")
    end = response_text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(response_text[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    return _fallback_advice(prediction)


class DiseaseAnalysisService:
    def analyze_image_bytes(
        self,
        image_bytes: bytes,
        *,
        filename: str | None = None,
        content_type: str | None = None,
    ) -> dict[str, Any]:
        _validate_image_upload(image_bytes, filename, content_type)
        image = _load_image(image_bytes)
        _preprocess_image(image)

        # Real model integration point: replace the mock predictor with a trained CNN/YOLOv8 model.
        prediction = _mock_predict(image_bytes, filename)
        query = f"{prediction.crop} {prediction.disease} crop disease treatment prevention"
        context = _get_retrieved_context(query)

        prompt = (
            f"Crop: {prediction.crop}\n"
            f"Predicted disease: {prediction.disease}\n"
            f"Confidence: {prediction.confidence}%\n"
            f"Severity: {prediction.severity}\n\n"
            f"Retrieved agricultural context:\n{context}\n\n"
            "Return JSON with disease_explanation, cause, treatment, prevention, and organic_solution."
        )

        try:
            llm_response = _get_llm().invoke(
                [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=prompt),
                ]
            )
            content = getattr(llm_response, "content", "") or ""
            advice = _parse_llm_json(content, prediction)
        except Exception as error:
            logger.exception("Groq generation failed: %s", error)
            advice = _fallback_advice(prediction)

        return {
            "crop": prediction.crop,
            "disease": prediction.disease,
            "confidence": prediction.confidence,
            "severity": prediction.severity,
            "disease_explanation": str(advice.get("disease_explanation", "")),
            "cause": str(advice.get("cause", "")),
            "treatment": self._ensure_list(advice.get("treatment")),
            "prevention": self._ensure_list(advice.get("prevention")),
            "organic_solution": self._ensure_list(advice.get("organic_solution")),
        }

    @staticmethod
    def _ensure_list(value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []