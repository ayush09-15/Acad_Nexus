import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.services.pdf_processor import PDFProcessor
from app.services.chunker import TextChunker
from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService

router = APIRouter(prefix="/api/ai", tags=["Ingest"])


class IngestPathRequest(BaseModel):
    class_id: str
    material_id: str
    document_title: str
    file_path: str


@router.post("/ingest")
async def ingest_document(
    file: Optional[UploadFile] = File(None),
    class_id: Optional[str] = Form(None),
    material_id: Optional[str] = Form(None),
    document_title: Optional[str] = Form(None),
):
    """
    Ingest a PDF file via multipart upload into the RAG vector store.
    """
    if not file:
        raise HTTPException(status_code=400, detail="A PDF file is required.")
    if not class_id or not material_id:
        raise HTTPException(status_code=400, detail="class_id and material_id are required.")

    title = document_title or file.filename or "Course Document"
    contents = await file.read()

    try:
        pages = PDFProcessor.extract_pages(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    if not pages:
        raise HTTPException(status_code=400, detail="The uploaded PDF contains no readable pages.")

    chunks = TextChunker.chunk_document_pages(
        pages=pages,
        material_id=material_id,
        class_id=class_id,
        document_title=title,
    )

    if not chunks:
        return {
            "success": True,
            "message": "PDF had no extractable text chunks (might be scanned images).",
            "pages_processed": len(pages),
            "chunks_indexed": 0,
        }

    # Generate embeddings and upsert
    texts = [c["text"] for c in chunks]
    embeddings = EmbeddingService.get_batch_embeddings(texts)
    indexed_count = VectorStoreService.upsert_chunks(chunks, embeddings)

    return {
        "success": True,
        "class_id": class_id,
        "material_id": material_id,
        "document_title": title,
        "pages_processed": len(pages),
        "chunks_indexed": indexed_count,
    }


@router.post("/ingest-path")
def ingest_document_by_path(payload: IngestPathRequest):
    """
    Ingest a PDF from a local file path (used by Node.js backend integration).
    """
    resolved_path = Path(payload.file_path)
    if not resolved_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {payload.file_path}")

    try:
        pages = PDFProcessor.extract_pages(str(resolved_path))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")

    chunks = TextChunker.chunk_document_pages(
        pages=pages,
        material_id=payload.material_id,
        class_id=payload.class_id,
        document_title=payload.document_title,
    )

    if not chunks:
        return {
            "success": True,
            "message": "No text chunks found in document.",
            "pages_processed": len(pages),
            "chunks_indexed": 0,
        }

    texts = [c["text"] for c in chunks]
    embeddings = EmbeddingService.get_batch_embeddings(texts)
    indexed_count = VectorStoreService.upsert_chunks(chunks, embeddings)

    return {
        "success": True,
        "class_id": payload.class_id,
        "material_id": payload.material_id,
        "document_title": payload.document_title,
        "pages_processed": len(pages),
        "chunks_indexed": indexed_count,
    }


@router.delete("/materials/{material_id}")
def delete_material_embeddings(material_id: str):
    """Remove all vectors associated with a material from the index."""
    VectorStoreService.delete_material_vectors(material_id)
    return {"success": True, "message": f"Vectors for material {material_id} deleted."}
