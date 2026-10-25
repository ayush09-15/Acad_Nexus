from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import ingest, query

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Document-grounded RAG service using Google Gemini and Pinecone.",
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route handlers
app.include_router(ingest.router)
app.include_router(query.router)


@app.get("/health")
def health_check():
    """Service health check and configuration status."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_model": settings.GEMINI_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "pinecone_index": settings.PINECONE_INDEX_NAME,
        "configured": {
            "gemini": bool(settings.GEMINI_API_KEY),
            "pinecone": bool(settings.PINECONE_API_KEY),
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
