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
    db: Session = Depends(get_db)
):
    """
    Register a new user after Firebase authentication.
    
    Flow:
    1. User authenticates with Firebase on frontend
    2. Frontend sends Firebase UID + user details to this endpoint
    3. Backend creates user in PostgreSQL
    4. Returns JWT token for API access
    """
    auth_service = AuthService(db)
    return auth_service.register_user(register_data)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: FirebaseTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Login user with Firebase ID token.
    
    Note: In production, verify the Firebase token here.
    For now, we'll extract the firebase_uid from the token.
    """
    # TODO: Verify Firebase token and extract firebase_uid
    # For now, we'll expect firebase_uid in the token field
    firebase_uid = login_data.id_token  # Temporary: should be extracted from verified token
    
    auth_service = AuthService(db)
    return auth_service.login_user(firebase_uid)


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "role": current_user.role.name if current_user.role else "user",
        "created_at": current_user.created_at
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user.
    
    Note: With JWT, logout is handled client-side by removing the token.
    This endpoint is mainly for logging purposes.
    """
    app_logger.info(f"User logged out: {current_user.username}")
    return {"message": "Logged out successfully"}