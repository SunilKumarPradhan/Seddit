from pydantic import BaseModel, EmailStr


class FirebaseTokenRequest(BaseModel):
    """Firebase ID token for authentication."""
    id_token: str


class RegisterRequest(BaseModel):
    """User registration request."""
    id_token: str
    firebase_uid: str
    email: EmailStr
    username: str
    avatar_url: str | None = None


class TokenUser(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar_url: str | None = None
    role: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: TokenUser