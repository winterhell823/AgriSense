from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv(dotenv_path=Path(__file__).with_name(".env"), override=False)

from backend.disease_analysis_service import (
    AgriSenseError,
    DiseaseAnalysisService,
)
from backend.rag_pipeline import answer_question


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("agrisense.backend")


def _parse_cors_origins() -> list[str]:
    raw_value = os.getenv("CORS_ORIGINS", "*").strip()
    if raw_value == "*":
        return ["*"]
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


app = FastAPI(title="AgriSense RAG Backend", version="1.0.0")
analysis_service = DiseaseAnalysisService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User question to answer from PDFs")
    session_id: str | None = Field(default=None, description="Optional client session id")


class SourceSnippet(BaseModel):
    source: str
    page: int | None = None
    excerpt: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceSnippet]
    source_count: int
    session_id: str | None = None


class DiseaseAnalysisResponse(BaseModel):
    crop: str
    disease: str
    confidence: int
    severity: str
    disease_explanation: str
    cause: str
    treatment: list[str]
    prevention: list[str]
    organic_solution: list[str]


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "AgriSense backend",
        "image_analysis": "ready",
    }


@app.exception_handler(AgriSenseError)
async def handle_agrisense_error(_, exc: AgriSenseError) -> JSONResponse:
    logger.warning("AgriSense error: %s", exc.message)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = answer_question(request.question)
        return ChatResponse(
            answer=result["answer"],
            sources=[SourceSnippet(**item) for item in result["sources"]],
            source_count=result["source_count"],
            session_id=request.session_id,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except Exception as error:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"RAG backend failed: {error}") from error


@app.post("/analyze-image", response_model=DiseaseAnalysisResponse)
@app.post("/predict-disease", response_model=DiseaseAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)) -> DiseaseAnalysisResponse:
    logger.info("Received image upload: filename=%s content_type=%s", file.filename, file.content_type)
    raw_bytes = await file.read()

    try:
        result = await asyncio.to_thread(
            analysis_service.analyze_image_bytes,
            raw_bytes,
            filename=file.filename,
            content_type=file.content_type,
        )
        return DiseaseAnalysisResponse(**result)
    except AgriSenseError:
        raise
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # pragma: no cover
        logger.exception("Unexpected image analysis failure")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {error}") from error


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.mainbot:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
