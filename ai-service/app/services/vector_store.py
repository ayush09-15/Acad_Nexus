import numpy as np
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings


class InMemoryVectorStore:
    """In-memory cosine similarity store for local testing and offline development."""

    def __init__(self):
        # Store dict: {chunk_id: {"id": str, "values": List[float], "metadata": dict}}
        self.vectors: Dict[str, Dict[str, Any]] = {}

    def upsert(self, records: List[Dict[str, Any]]):
        for rec in records:
            self.vectors[rec["id"]] = rec

    def query(
        self,
        vector: List[float],
        filter_dict: Optional[Dict[str, Any]] = None,
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        results = []
        q_vec = np.array(vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)

        for rec in self.vectors.values():
            meta = rec.get("metadata", {})
            # Check filter (e.g. class_id)
            if filter_dict:
                match = True
                for k, v in filter_dict.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            d_vec = np.array(rec["values"], dtype=np.float32)
            d_norm = np.linalg.norm(d_vec)
            score = 0.0
            if q_norm > 0 and d_norm > 0:
                score = float(np.dot(q_vec, d_vec) / (q_norm * d_norm))

            results.append({
                "id": rec["id"],
                "score": score,
                "metadata": meta,
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def delete(self, filter_dict: Dict[str, Any]):
        to_delete = []
        for cid, rec in self.vectors.items():
            meta = rec.get("metadata", {})
            match = True
            for k, v in filter_dict.items():
                if meta.get(k) != v:
                    match = False
                    break
            if match:
                to_delete.append(cid)
        for cid in to_delete:
            del self.vectors[cid]


class VectorStoreService:
    """Manages Pinecone vector database operations with in-memory fallback."""

    _pc: Optional[Pinecone] = None
    _index = None
    _fallback_store = InMemoryVectorStore()

    @classmethod
    def get_index(cls):
        if not settings.PINECONE_API_KEY:
            return None

        if cls._index is not None:
            return cls._index

        try:
            cls._pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            # Check if index exists, else create serverless index
            existing = [idx.name for idx in cls._pc.list_indexes()]
            if settings.PINECONE_INDEX_NAME not in existing:
                cls._pc.create_index(
                    name=settings.PINECONE_INDEX_NAME,
                    dimension=768,  # Gemini text-embedding-004 dimension
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
                )
            cls._index = cls._pc.Index(settings.PINECONE_INDEX_NAME)
            return cls._index
        except Exception as e:
            print(f"Warning: Pinecone initialization failed ({e}). Using in-memory store.")
            return None

    @classmethod
    def upsert_chunks(cls, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Upsert document chunks into vector index with classroom metadata.
        """
        records = []
        for chunk, emb in zip(chunks, embeddings):
            records.append({
                "id": chunk["chunk_id"],
                "values": emb,
                "metadata": {
                    "class_id": str(chunk["class_id"]),
                    "material_id": str(chunk["material_id"]),
                    "document_title": chunk["document_title"],
                    "page_number": int(chunk["page_number"]),
                    "text": chunk["text"],
                },
            })

        index = cls.get_index()
        if index is not None:
            try:
                # Upsert in batches of 100
                batch_size = 100
                for i in range(0, len(records), batch_size):
                    batch = records[i : i + batch_size]
                    index.upsert(vectors=batch)
                return len(records)
            except Exception as e:
                print(f"Pinecone upsert error: {e}. Falling back to memory store.")

        cls._fallback_store.upsert(records)
        return len(records)

    @classmethod
    def similarity_search(
        cls,
        query_embedding: List[float],
        class_id: str,
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        """
        Search top-k most relevant chunks for a question strictly within a class.
        """
        filter_dict = {"class_id": str(class_id)}
        index = cls.get_index()

        if index is not None:
            try:
                response = index.query(
                    vector=query_embedding,
                    filter=filter_dict,
                    top_k=top_k,
                    include_metadata=True,
                )
                matches = []
                for match in response.get("matches", []):
                    matches.append({
                        "id": match.get("id"),
                        "score": match.get("score"),
                        "metadata": match.get("metadata", {}),
                    })
                return matches
            except Exception as e:
                print(f"Pinecone query error: {e}. Falling back to memory store.")

        return cls._fallback_store.query(
            vector=query_embedding,
            filter_dict=filter_dict,
            top_k=top_k,
        )

    @classmethod
    def delete_material_vectors(cls, material_id: str):
        """Delete all vectors belonging to a deleted material."""
        index = cls.get_index()
        if index is not None:
            try:
                index.delete(filter={"material_id": str(material_id)})
            except Exception as e:
                print(f"Pinecone delete error: {e}")

        cls._fallback_store.delete({"material_id": str(material_id)})
