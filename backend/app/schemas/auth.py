from pydantic import BaseModel, EmailStr


class FirebaseTokenRequest(BaseModel):
    """Firebase ID token for authentication."""
    id_token: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class RegisterRequest(BaseModel):
    """User registration request."""
    firebase_uid: str
    email: EmailStr
    username: str
    avatar_url: str | None = None


class LoginResponse(BaseModel):
    """Login response with user info."""
    access_token: str
    token_type: str = "bearer"
    user: dict