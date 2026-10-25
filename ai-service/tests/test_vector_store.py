from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStoreService, InMemoryVectorStore


def test_embedding_generation_dimension():
    vec = EmbeddingService.get_embedding("What is virtual memory in operating systems?")
    assert len(vec) == 768
    assert isinstance(vec[0], float)


def test_in_memory_vector_store_class_isolation():
    store = InMemoryVectorStore()

    # Vectors for Class A
    store.upsert([
        {
            "id": "chunk_A1",
            "values": [1.0, 0.0, 0.0],
            "metadata": {"class_id": "class_A", "text": "Operating systems process scheduling."},
        }
    ])

    # Vectors for Class B
    store.upsert([
        {
            "id": "chunk_B1",
            "values": [1.0, 0.0, 0.0],
            "metadata": {"class_id": "class_B", "text": "Organic chemistry benzene rings."},
        }
    ])

    # Query strictly for Class A
    results_A = store.query(
        vector=[1.0, 0.0, 0.0],
        filter_dict={"class_id": "class_A"},
        top_k=5,
    )

    assert len(results_A) == 1
    assert results_A[0]["id"] == "chunk_A1"
    assert results_A[0]["metadata"]["class_id"] == "class_A"


def test_vector_store_service_upsert_and_search():
    mock_chunks = [
        {
            "chunk_id": "mat1_p1_c1",
            "class_id": "class_os",
            "material_id": "mat1",
            "document_title": "OS Syllabus",
            "page_number": 1,
            "text": "Processes are instances of running computer programs.",
        }
    ]
    embs = [EmbeddingService.get_embedding(mock_chunks[0]["text"])]

    count = VectorStoreService.upsert_chunks(mock_chunks, embs)
    assert count == 1

    query_emb = EmbeddingService.get_query_embedding("What is a process?")
    results = VectorStoreService.similarity_search(query_emb, class_id="class_os", top_k=2)

    assert len(results) >= 1
    assert results[0]["metadata"]["class_id"] == "class_os"
    assert "process" in results[0]["metadata"]["text"].lower()
