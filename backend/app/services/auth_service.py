from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.firebase_auth import verify_firebase_id_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, TokenResponse, TokenUser
from app.schemas.user import UserCreate
from app.core.security import create_access_token
from app.utils.logger import app_logger


class AuthService:
    """Service for authentication and authorization."""

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register_user(self, register_data: RegisterRequest) -> TokenResponse:
        """Create a user after verifying the Firebase token."""
        try:
            claims = verify_firebase_id_token(register_data.id_token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase credentials",
            ) from None

        firebase_uid = claims["uid"]
        if firebase_uid != register_data.firebase_uid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firebase UID mismatch",
            )

        email = claims.get("email")
        if email and email.lower() != register_data.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email does not match Firebase token",
            )

        if self.user_repo.get_by_firebase_uid(firebase_uid):
            app_logger.info("User already exists, issuing token")
            existing_user = self.user_repo.get_by_firebase_uid(firebase_uid)
            return self._generate_token_response(existing_user)

        if self.user_repo.get_by_email(register_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        if self.user_repo.get_by_username(register_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )

        avatar = register_data.avatar_url or claims.get("picture")
        user = self.user_repo.create(
            UserCreate(
                firebase_uid=firebase_uid,
                email=register_data.email,
                username=register_data.username,
                avatar_url=avatar,
            )
        )
        app_logger.info("New user registered: %s", user.username)
        return self._generate_token_response(user)

    def login_user(self, id_token: str) -> TokenResponse:
        """Authenticate a user using a Firebase ID token."""
        try:
            claims = verify_firebase_id_token(id_token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase credentials",
            ) from None

        firebase_uid = claims["uid"]
        user = self.user_repo.get_by_firebase_uid(firebase_uid)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please register first.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        if user.is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is banned",
            )

        return self._generate_token_response(user)

    def _generate_token_response(self, user: User) -> TokenResponse:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"user_id": user.id, "username": user.username},
            expires_delta=access_token_expires,
        )

        return TokenResponse(
            access_token=access_token,
            user=TokenUser(
                id=user.id,
                username=user.username,
                email=user.email,
                avatar_url=user.avatar_url,
                role=user.role.name if user.role else "user",
            ),
        )