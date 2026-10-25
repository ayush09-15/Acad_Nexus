from fastapi.testclient import TestClient
from app.main import app
from app.services.vector_store import VectorStoreService
from app.services.embeddings import EmbeddingService

client = TestClient(app)


def test_query_empty_class_returns_guidance():
    response = client.post(
        "/api/ai/query",
        json={"class_id": "non_existent_class", "question": "What is round robin scheduling?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "No study materials have been uploaded" in data["answer"]
    assert len(data["citations"]) == 0


def test_end_to_end_ingestion_and_class_isolated_query():
    class_id = "test_class_os_101"
    material_id = "mat_os_lec1"

    # Seed mock chunks into vector store
    mock_chunks = [
        {
            "chunk_id": f"{material_id}_p1_c1",
            "class_id": class_id,
            "material_id": material_id,
            "document_title": "Operating Systems Unit 1",
            "page_number": 4,
            "text": "Round Robin scheduling assigns a fixed time quantum of CPU execution to each process in the ready queue.",
        }
    ]
    embs = [EmbeddingService.get_embedding(mock_chunks[0]["text"])]
    VectorStoreService.upsert_chunks(mock_chunks, embs)

    # 1. Query for the correct class
    response = client.post(
        "/api/ai/query",
        json={"class_id": class_id, "question": "Explain Round Robin scheduling time quantum"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["citations"]) >= 1
    assert data["citations"][0]["document_title"] == "Operating Systems Unit 1"
    assert data["citations"][0]["page_number"] == 4

    # 2. Query for a DIFFERENT class (proves classroom boundary isolation)
    other_response = client.post(
        "/api/ai/query",
        json={"class_id": "different_class_id", "question": "Explain Round Robin"},
    )
    assert other_response.status_code == 200
    other_data = other_response.json()
    assert len(other_data["citations"]) == 0
    assert "No study materials" in other_data["answer"]

    # 3. Clean up by deleting material vectors
    del_response = client.delete(f"/api/ai/materials/{material_id}")
    assert del_response.status_code == 200
    assert del_response.json()["success"] is True
