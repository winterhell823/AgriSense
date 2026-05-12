from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from langchain_classic.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

try:
    from .llm_memory import get_vectorstore
except ImportError:  # pragma: no cover
    from llm_memory import get_vectorstore


DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
DEFAULT_TEMPERATURE = float(os.getenv("GROQ_TEMPERATURE", "0.3"))
DEFAULT_TOP_K = int(os.getenv("RAG_TOP_K", "4"))

AGRI_PROMPT_TEMPLATE = """
You are AgriSense AI, a practical agricultural assistant.

Use only the provided context to answer the user's question.

Rules:
- Answer clearly and directly.
- If the answer is not in the context, say you do not have enough information from the PDFs.
- Focus on crops, farming, soil, irrigation, pests, plant diseases, and agriculture.
- Be concise, practical, and farmer-friendly.

Context:
{context}

Question:
{question}

Answer:
""".strip()


def _get_api_key() -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing. Add it to your backend .env file.")
    return api_key


@lru_cache(maxsize=1)
def get_llm():
    return ChatGroq(
        model_name=DEFAULT_MODEL,
        api_key=_get_api_key(),
        temperature=DEFAULT_TEMPERATURE,
    )


@lru_cache(maxsize=1)
def get_prompt():
    return PromptTemplate(
        template=AGRI_PROMPT_TEMPLATE,
        input_variables=["context", "question"],
    )


def _format_sources(source_documents: list[Any]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []

    for document in source_documents:
        metadata = document.metadata or {}
        sources.append(
            {
                "source": metadata.get("source") or metadata.get("filename") or "unknown",
                "page": metadata.get("page"),
                "excerpt": document.page_content[:240].strip(),
            }
        )

    return sources


def answer_question(question: str) -> dict[str, Any]:
    clean_question = question.strip()
    if not clean_question:
        raise ValueError("Question cannot be empty.")

    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": DEFAULT_TOP_K})

    chain = RetrievalQA.from_chain_type(
        llm=get_llm(),
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": get_prompt()},
    )

    response = chain.invoke({"query": clean_question})
    result = response.get("result", "").strip()
    source_documents = response.get("source_documents", [])

    return {
        "answer": result,
        "sources": _format_sources(source_documents),
        "source_count": len(source_documents),
    }
