import io
import re
from pathlib import Path
from typing import List, Dict, Any, Union
from pypdf import PdfReader


def clean_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    if not text:
        return ""
    # Replace multiple newlines or tabs with consistent formatting
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


class PDFProcessor:
    """Extracts text page-by-page from PDF files for RAG grounding."""

    @staticmethod
    def extract_pages(source: Union[str, Path, bytes, io.BytesIO]) -> List[Dict[str, Any]]:
        """
        Extract page text with 1-based page numbers.

        Args:
            source: File path (str/Path) or raw PDF bytes / BytesIO buffer.

        Returns:
            List of dicts: [{"page_number": int, "text": str, "char_count": int}]
        """
        if isinstance(source, (str, Path)):
            reader = PdfReader(str(source))
        elif isinstance(source, bytes):
            reader = PdfReader(io.BytesIO(source))
        elif isinstance(source, io.BytesIO):
            reader = PdfReader(source)
        else:
            raise ValueError(f"Unsupported PDF source type: {type(source)}")

        pages: List[Dict[str, Any]] = []

        for idx, page in enumerate(reader.pages):
            page_text = clean_text(page.extract_text() or "")
            pages.append({
                "page_number": idx + 1,
                "text": page_text,
                "char_count": len(page_text),
            })

        return pages
