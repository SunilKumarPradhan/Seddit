from fastapi import APIRouter
from app.api.v1 import auth, posts, comments, users, websocket, admin

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(posts.router)
api_router.include_router(comments.router)
api_router.include_router(users.router)
api_router.include_router(websocket.router)
api_router.include_router(admin.router)