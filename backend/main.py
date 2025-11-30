"""
Entry point for running the FastAPI application.

Usage:
    uv run python main.py
    
Or with uvicorn directly:
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
from fastapi import FastAPI

app = FastAPI()
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )