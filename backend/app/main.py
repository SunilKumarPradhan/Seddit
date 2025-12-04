import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.core.redis_client import redis_client
from app.middleware.logging import LoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.utils.logger import app_logger

from app.services.notification_stream import (
    notification_stream_worker,
    stop_notification_worker,
)

from app.api.v1 import auth, posts, comments, users, websocket, admin  # Added admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    app_logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)

    init_db()

    notification_task = None
    try:
        redis_client.connect()
        notification_task = asyncio.create_task(notification_stream_worker())
    except Exception as exc:
        app_logger.error(f"Redis initialization failed: {exc}")

    app_logger.info("Application started successfully")
    try:
        yield
    finally:
        app_logger.info("Shutting down application")
        await stop_notification_worker(notification_task)
        redis_client.disconnect()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-time meme sharing forum API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# Include all routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(websocket.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")  # Added admin router


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }