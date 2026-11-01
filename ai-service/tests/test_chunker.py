from app.services.chunker import split_text_into_chunks, TextChunker
from app.services.pdf_processor import clean_text


def test_clean_text_normalizes_whitespace():
    raw = "  Hello   world! \r\n\r\n\n\n\nThis   is  a\ttest.   "
    cleaned = clean_text(raw)
    assert "Hello world!" in cleaned
    assert "\n\n" in cleaned
    assert "  " not in cleaned


def test_split_text_into_chunks_small():
    text = "Short introductory paragraph for operating systems."
    chunks = split_text_into_chunks(text, chunk_size=200, chunk_overlap=50)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_split_text_into_chunks_large():
    paragraphs = [
        f"Paragraph {i}: Operating systems manage hardware resources and provide common services for computer programs. "
        f"The operating system is the most important type of system software in a computer system."
        for i in range(1, 15)
    ]
    long_text = "\n\n".join(paragraphs)
    chunks = split_text_into_chunks(long_text, chunk_size=350, chunk_overlap=50)

    assert len(chunks) > 1
    for c in chunks:
        assert len(c) > 0


def test_chunk_document_pages_metadata_preservation():
    mock_pages = [
        {"page_number": 1, "text": "Page one covers CPU scheduling and process states."},
        {"page_number": 2, "text": "Page two introduces deadlocks and mutual exclusion."},
        {"page_number": 3, "text": "   "},  # Blank page should be skipped
    ]

    chunks = TextChunker.chunk_document_pages(
        pages=mock_pages,
        material_id="mat_123",
        class_id="class_456",
        document_title="OS Lecture Notes",
        chunk_size=500,
        chunk_overlap=50,
    )

    assert len(chunks) == 2
    assert chunks[0]["page_number"] == 1
    assert chunks[0]["material_id"] == "mat_123"
    assert chunks[0]["class_id"] == "class_456"
    assert chunks[0]["document_title"] == "OS Lecture Notes"
    assert chunks[0]["chunk_id"] == "mat_123_p1_c1"

    assert chunks[1]["page_number"] == 2
    assert chunks[1]["chunk_id"] == "mat_123_p2_c1"
