import hashlib
import numpy as np
from typing import List
import google.generativeai as genai
from app.core.config import settings

# Initialize Gemini if key is available
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


def generate_fallback_embedding(text: str, dimension: int = 768) -> List[float]:
    """
    Generate a deterministic unit-normalized mock embedding vector for tests/local dev
    when no Gemini API key is configured.
    """
    # Create deterministic pseudorandom seed from text content
    seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)
    vector = rng.standard_normal(dimension).astype(np.float32)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector.tolist()


class EmbeddingService:
    """Generates dense vector embeddings using Google Gemini text-embedding-004."""

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """Generate embedding vector for a single string."""
        if not text:
            return [0.0] * 768

        if not settings.GEMINI_API_KEY:
            return generate_fallback_embedding(text)

        try:
            result = genai.embed_content(
                model=settings.EMBEDDING_MODEL,
                content=text,
                task_type="retrieval_document",
            )
            return result["embedding"]
        except Exception as e:
            print(f"Warning: Gemini embedding failed ({e}), using fallback embedding.")
            return generate_fallback_embedding(text)

    @classmethod
    def get_query_embedding(cls, query: str) -> List[float]:
        """Generate embedding vector for a user question."""
        if not query:
            return [0.0] * 768

        if not settings.GEMINI_API_KEY:
            return generate_fallback_embedding(query)

        try:
            result = genai.embed_content(
                model=settings.EMBEDDING_MODEL,
                content=query,
                task_type="retrieval_query",
            )
            return result["embedding"]
        except Exception as e:
            print(f"Warning: Gemini query embedding failed ({e}), using fallback embedding.")
            return generate_fallback_embedding(query)

    @classmethod
    def get_batch_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        return [cls.get_embedding(t) for t in texts]
