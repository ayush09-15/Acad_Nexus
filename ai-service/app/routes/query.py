from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService
from app.services.rag_engine import RAGEngine
from app.core.config import settings

router = APIRouter(prefix="/api/ai", tags=["Query"])


class RAGQueryRequest(BaseModel):
    class_id: str = Field(..., description="The ID of the classroom.")
    question: str = Field(..., min_length=2, description="The student's question.")
    top_k: Optional[int] = Field(settings.TOP_K_RESULTS, description="Number of source chunks to retrieve.")


@router.post("/query")
def answer_student_question(payload: RAGQueryRequest):
    """
    Answer a question using documents strictly belonging to the given classroom,
    grounded with source citations (document title and page numbers).
    """
    clean_question = payload.question.strip()
    if not clean_question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 1. Generate query embedding
    query_emb = EmbeddingService.get_query_embedding(clean_question)

    # 2. Retrieve top matching chunks filtered by class_id
    matches = VectorStoreService.similarity_search(
        query_embedding=query_emb,
        class_id=payload.class_id,
        top_k=payload.top_k or settings.TOP_K_RESULTS,
    )

    # 3. Generate grounded answer with citations
    result = RAGEngine.generate_answer(clean_question, matches)

    return {
        "success": True,
        "class_id": payload.class_id,
        "question": clean_question,
        "answer": result["answer"],
        "citations": result["citations"],
        "sources_count": len(result["citations"]),
    }
