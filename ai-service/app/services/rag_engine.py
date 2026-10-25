from typing import List, Dict, Any
import google.generativeai as genai
from app.core.config import settings

SYSTEM_INSTRUCTION = """You are an academic AI teaching assistant for Acad Nexus.
Your job is to answer students' questions thoroughly, accurately, and strictly using ONLY the provided course documents.

Rules:
1. Ground your answer in the provided document context.
2. For every fact or concept you explain, cite the source in the format: [Document Name, Page X].
3. If the provided documents do not contain enough information to answer the question, state:
   "Based on the uploaded course materials for this class, this topic is not covered in the current documents."
4. Be clear, academic, helpful, and concise.
"""


def build_rag_prompt(question: str, context_chunks: List[Dict[str, Any]]) -> str:
    """Format academic context chunks with explicit document and page citations."""
    formatted_context = []
    for idx, c in enumerate(context_chunks, start=1):
        meta = c.get("metadata", {})
        title = meta.get("document_title", "Course Document")
        page = meta.get("page_number", "?")
        text = meta.get("text", "")
        formatted_context.append(f"--- [Source {idx}: \"{title}\", Page {page}] ---\n{text}")

    context_str = "\n\n".join(formatted_context)

    return f"""Context from course documents:
{context_str}

Student Question:
{question}

Answer with source citations [Document Title, Page X]:"""


class RAGEngine:
    """Orchestrates retrieval-augmented generation using Gemini 1.5 Flash."""

    @classmethod
    def generate_answer(
        cls,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Synthesize answer from retrieved chunks with citations.
        """
        if not retrieved_chunks:
            return {
                "answer": "No study materials have been uploaded or matched for this classroom yet. Please ask your professor to upload course notes or lecture slides.",
                "citations": [],
            }

        # Deduplicate citations by document and page
        citations = []
        seen = set()
        for c in retrieved_chunks:
            meta = c.get("metadata", {})
            key = (meta.get("document_title"), meta.get("page_number"))
            if key not in seen:
                seen.add(key)
                citations.append({
                    "document_title": meta.get("document_title"),
                    "page_number": meta.get("page_number"),
                    "score": round(float(c.get("score", 0.0)), 4),
                    "chunk_id": c.get("id"),
                })

        prompt = build_rag_prompt(question, retrieved_chunks)

        if not settings.GEMINI_API_KEY:
            # Deterministic fallback response when running in mock / keyless mode
            top_meta = retrieved_chunks[0].get("metadata", {})
            top_title = top_meta.get("document_title", "Course Document")
            top_page = top_meta.get("page_number", 1)
            preview = top_meta.get("text", "")[:200]
            answer = (
                f"According to {top_title} (Page {top_page}): {preview}... "
                f"[{top_title}, Page {top_page}]"
            )
            return {
                "answer": answer,
                "citations": citations,
            }

        try:
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=SYSTEM_INSTRUCTION,
            )
            response = model.generate_content(prompt)
            return {
                "answer": response.text.strip(),
                "citations": citations,
            }
        except Exception as e:
            print(f"Gemini generation error: {e}")
            top_meta = retrieved_chunks[0].get("metadata", {})
            top_title = top_meta.get("document_title", "Course Document")
            top_page = top_meta.get("page_number", 1)
            return {
                "answer": f"Unable to reach Gemini API ({str(e)}). Please verify your GEMINI_API_KEY.",
                "citations": citations,
            }
