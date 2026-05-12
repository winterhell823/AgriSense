from __future__ import annotations


import os
from functools import lru_cache
from pathlib import Path

from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = Path(os.getenv("AGRI_DATA_DIR", PROJECT_ROOT / "data"))
DEFAULT_VECTORSTORE_DIR = Path(
    os.getenv("AGRI_VECTORSTORE_DIR", PROJECT_ROOT / "backend" / "vectorstore" / "db_faiss")
)


def resolve_data_dir() -> Path:
    return DEFAULT_DATA_DIR


def resolve_vectorstore_dir() -> Path:
    return DEFAULT_VECTORSTORE_DIR


def load_pdf_files(data_dir: Path | str | None = None):
    source_dir = Path(data_dir) if data_dir else resolve_data_dir()
    loader = DirectoryLoader(str(source_dir), glob="*.pdf", loader_cls=PyPDFLoader)
    return loader.load()


def create_chunks(documents):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_documents(documents)


@lru_cache(maxsize=1)
def get_embedding_model():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


def _vectorstore_files_exist(vectorstore_dir: Path) -> bool:
    return (vectorstore_dir / "index.faiss").exists() and (vectorstore_dir / "index.pkl").exists()


@lru_cache(maxsize=1)
def get_vectorstore():
    vectorstore_dir = resolve_vectorstore_dir()
    vectorstore_dir.mkdir(parents=True, exist_ok=True)

    if _vectorstore_files_exist(vectorstore_dir):
        return FAISS.load_local(
            str(vectorstore_dir),
            get_embedding_model(),
            allow_dangerous_deserialization=True,
        )

    documents = load_pdf_files()
    if not documents:
        raise FileNotFoundError(
            f"No PDF files found in {resolve_data_dir()}. Add your source PDFs there."
        )

    chunks = create_chunks(documents)
    vectorstore = FAISS.from_documents(chunks, get_embedding_model())
    vectorstore.save_local(str(vectorstore_dir))
    return vectorstore


def reset_vectorstore_cache() -> None:
    get_vectorstore.cache_clear()
