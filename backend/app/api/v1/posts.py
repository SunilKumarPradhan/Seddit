from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostListResponse, VoteCreate
from app.services.post_service import PostService
from app.dependencies import get_current_user, get_optional_user
from app.models.user import User

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new post."""
    post_service = PostService(db)
    return post_service.create_post(post_data, current_user)


@router.get("", response_model=PostListResponse)
async def get_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tag: Optional[str] = Query(None),
    sort_by: str = Query("new", regex="^(new|hot|top)$"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of posts.
    
    - **page**: Page number (starts at 1)
    - **page_size**: Number of posts per page (max 100)
    - **tag**: Filter by tag
    - **sort_by**: Sort by 'new', 'hot', or 'top'
    """
    post_service = PostService(db)
    return post_service.get_posts(page, page_size, tag, sort_by, current_user)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get a specific post by ID."""
    post_service = PostService(db)
    return post_service.get_post(post_id, current_user)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a post."""
    post_service = PostService(db)
    return post_service.update_post(post_id, post_data, current_user)


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a post."""
    post_service = PostService(db)
    return post_service.delete_post(post_id, current_user)


@router.post("/{post_id}/vote", response_model=PostResponse)
async def vote_post(
    post_id: int,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vote on a post (upvote or downvote)."""
    post_service = PostService(db)
    return post_service.vote_post(post_id, vote_data, current_user)


@router.delete("/{post_id}/vote", response_model=PostResponse)
async def remove_vote(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove vote from a post."""
    post_service = PostService(db)
    return post_service.remove_vote(post_id, current_user)


@router.post("/{post_id}/favorite")
async def toggle_favorite(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status of a post."""
    post_service = PostService(db)
    return post_service.toggle_favorite(post_id, current_user)


@router.get("/user/{user_id}", response_model=PostListResponse)
async def get_user_posts(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get all posts by a specific user."""
    post_service = PostService(db)
    return post_service.get_user_posts(user_id, page, page_size, current_user)