from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse, CommentTreeResponse
from app.schemas.post import VoteCreate
from app.services.comment_service import CommentService
from app.dependencies import get_current_user, get_optional_user
from app.models.user import User

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comment or reply."""
    comment_service = CommentService(db)
    return comment_service.create_comment(comment_data, current_user)


@router.get("/post/{post_id}", response_model=CommentTreeResponse)
async def get_post_comments(
    post_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get all comments for a post in tree structure."""
    comment_service = CommentService(db)
    return comment_service.get_post_comments(post_id, current_user)


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get a specific comment by ID."""
    comment_service = CommentService(db)
    return comment_service.get_comment(comment_id, current_user)


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment."""
    comment_service = CommentService(db)
    return comment_service.update_comment(comment_id, comment_data, current_user)


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment."""
    comment_service = CommentService(db)
    return comment_service.delete_comment(comment_id, current_user)


@router.post("/{comment_id}/vote", response_model=CommentResponse)
async def vote_comment(
    comment_id: int,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vote on a comment."""
    comment_service = CommentService(db)
    return comment_service.vote_comment(comment_id, vote_data.vote_type, current_user)


@router.delete("/{comment_id}/vote", response_model=CommentResponse)
async def remove_vote(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove vote from a comment."""
    comment_service = CommentService(db)
    return comment_service.remove_vote(comment_id, current_user)