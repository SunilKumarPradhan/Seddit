from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CommentBase(BaseModel):
    """Base comment schema."""
    content: str = Field(..., min_length=1, max_length=10000)


class CommentCreate(CommentBase):
    """Schema for creating a comment."""
    post_id: int
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""
    content: str = Field(..., min_length=1, max_length=10000)


class CommentResponse(CommentBase):
    """Schema for comment response."""
    id: int
    post_id: int
    user_id: int
    parent_id: Optional[int] = None
    upvotes: int
    downvotes: int
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Author info
    author_username: str
    author_avatar: Optional[str] = None
    
    # Computed
    user_vote: Optional[str] = None
    replies: list["CommentResponse"] = []
    
    model_config = ConfigDict(from_attributes=True)


class CommentTreeResponse(BaseModel):
    """Nested comment tree."""
    comments: list[CommentResponse]
    total: int