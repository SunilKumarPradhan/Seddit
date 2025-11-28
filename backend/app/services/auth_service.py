from typing import Optional
from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.user import UserCreate
from app.repositories.user_repository import UserRepository
from app.core.security import create_access_token
from app.config import settings
from app.utils.logger import app_logger


class AuthService:
    """Service for authentication and authorization."""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
    
    def register_user(self, register_data: RegisterRequest) -> TokenResponse:
        """
        Register a new user from Firebase authentication.
        
        Args:
            register_data: User registration data with Firebase UID
        
        Returns:
            TokenResponse with access token and user info
        """
        # Check if user already exists
        existing_user = self.user_repo.get_by_firebase_uid(register_data.firebase_uid)
        if existing_user:
            app_logger.info(f"User already exists: {existing_user.username}")
            return self._generate_token_response(existing_user)
        
        # Check if email is taken
        if self.user_repo.get_by_email(register_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username is taken
        if self.user_repo.get_by_username(register_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create user
        user_data = UserCreate(
            firebase_uid=register_data.firebase_uid,
            email=register_data.email,
            username=register_data.username,
            avatar_url=register_data.avatar_url
        )
        
        user = self.user_repo.create(user_data)
        app_logger.info(f"New user registered: {user.username}")
        
        return self._generate_token_response(user)
    
    def login_user(self, firebase_uid: str) -> TokenResponse:
        """
        Login user with Firebase UID.
        
        Args:
            firebase_uid: Firebase user ID
        
        Returns:
            TokenResponse with access token and user info
        """
        user = self.user_repo.get_by_firebase_uid(firebase_uid)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please register first."
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        if user.is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is banned"
            )
        
        app_logger.info(f"User logged in: {user.username}")
        return self._generate_token_response(user)
    
    def _generate_token_response(self, user: User) -> TokenResponse:
        """Generate JWT token response for user."""
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"user_id": user.id, "username": user.username},
            expires_delta=access_token_expires
        )
        
        # Prepare user info
        user_info = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "role": user.role.name if user.role else "user"
        }
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_info
        )