from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common attributes."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    """Schema for user registration."""
    firebase_uid: str
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role_id: int
    is_active: bool
    is_banned: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserWithRole(UserResponse):
    """User response with role information."""
    role_name: str
    permissions: list[str]


class UserProfile(BaseModel):
    """Public user profile."""
    id: int
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)