from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class PostBase(BaseModel):
    """Base post schema."""
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    tag: Optional[str] = Field(None, max_length=50)


class PostCreate(PostBase):
    """Schema for creating a post."""
    image_url: Optional[str] = None


class PostUpdate(BaseModel):
    """Schema for updating a post."""
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    tag: Optional[str] = Field(None, max_length=50)


class PostResponse(PostBase):
    """Schema for post response."""
    id: int
    user_id: int
    image_url: Optional[str] = None
    upvotes: int
    downvotes: int
    is_locked: bool
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Author info
    author_username: str
    author_avatar: Optional[str] = None
    
    # Computed fields
    comment_count: int = 0
    user_vote: Optional[str] = None  # 'up', 'down', or None
    is_favorited: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class PostListResponse(BaseModel):
    """Paginated list of posts."""
    posts: list[PostResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class VoteCreate(BaseModel):
    """Schema for voting."""
    vote_type: str = Field(..., pattern="^(up|down)$")


class VoteResponse(BaseModel):
    """Vote response."""
    id: int
    user_id: int
    post_id: Optional[int] = None
    comment_id: Optional[int] = None
    vote_type: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)