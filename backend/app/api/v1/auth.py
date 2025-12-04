from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import RegisterRequest, FirebaseTokenRequest, TokenResponse
from app.services.auth_service import AuthService
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.logger import app_logger

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new user after Firebase authentication."""
    auth_service = AuthService(db)
    return auth_service.register_user(register_data)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: FirebaseTokenRequest,
    db: Session = Depends(get_db),
):
    """Login user with Firebase ID token."""
    auth_service = AuthService(db)
    return auth_service.login_user(login_data.id_token)