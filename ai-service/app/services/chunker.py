from typing import List, Dict, Any


def split_text_into_chunks(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> List[str]:
    """
    Split text recursively on natural boundaries (paragraphs, sentences, words).
    """
    if not text or not text.strip():
        return []

    if len(text) <= chunk_size:
        return [text.strip()]

    chunks: List[str] = []
    separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

    def _split_recursive(t: str, seps: List[str]) -> List[str]:
        if len(t) <= chunk_size:
            return [t] if t.strip() else []

        sep = seps[0] if seps else ""
        next_seps = seps[1:] if len(seps) > 1 else []

        if sep:
            splits = t.split(sep)
        else:
            splits = list(t)

        pieces: List[str] = []
        for piece in splits:
            if not piece.strip():
                continue
            if len(piece) > chunk_size and next_seps:
                pieces.extend(_split_recursive(piece, next_seps))
            else:
                pieces.append(piece)
        return pieces

    raw_pieces = _split_recursive(text, separators)

    # Merge pieces into chunks with overlap
    current_chunk: List[str] = []
    current_length = 0

    for piece in raw_pieces:
        piece_len = len(piece)
        if current_length + piece_len + 1 > chunk_size and current_chunk:
            combined = " ".join(current_chunk).strip()
            if combined:
                chunks.append(combined)

            # Keep pieces that fit within overlap
            overlap_pieces: List[str] = []
            overlap_len = 0
            for p in reversed(current_chunk):
                if overlap_len + len(p) + 1 <= chunk_overlap:
                    overlap_pieces.insert(0, p)
                    overlap_len += len(p) + 1
                else:
                    break

            current_chunk = overlap_pieces
            current_length = sum(len(p) for p in current_chunk) + len(current_chunk)

        current_chunk.append(piece)
        current_length += piece_len + 1

    if current_chunk:
        combined = " ".join(current_chunk).strip()
        if combined:
            chunks.append(combined)

    return chunks


class TextChunker:
    """Chunks document pages into semantic pieces tagged with class & page metadata."""

    @staticmethod
    def chunk_document_pages(
        pages: List[Dict[str, Any]],
        material_id: str,
        class_id: str,
        document_title: str,
        chunk_size: int = 800,
        chunk_overlap: int = 150,
    ) -> List[Dict[str, Any]]:
        """
        Creates chunks from page-extracted text with metadata.
        """
        all_chunks: List[Dict[str, Any]] = []

        for page in pages:
            page_number = page.get("page_number", 1)
            raw_text = page.get("text", "")

            if not raw_text.strip():
                continue

            page_chunks = split_text_into_chunks(
                text=raw_text,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )

            for idx, chunk_text in enumerate(page_chunks):
                chunk_id = f"{material_id}_p{page_number}_c{idx + 1}"
                all_chunks.append({
                    "chunk_id": chunk_id,
                    "class_id": str(class_id),
                    "material_id": str(material_id),
                    "document_title": document_title,
                    "page_number": page_number,
                    "text": chunk_text,
                    "char_count": len(chunk_text),
                })

        return all_chunks
