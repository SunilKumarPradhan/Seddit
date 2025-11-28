from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import (
    CommentCreate, CommentUpdate, CommentResponse, CommentTreeResponse
)
from app.repositories.comment_repository import CommentRepository
from app.repositories.post_repository import PostRepository
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.core.permissions import has_permission, check_resource_ownership
from app.utils.logger import app_logger


class CommentService:
    """Service for comment operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.comment_repo = CommentRepository(db)
        self.post_repo = PostRepository(db)
        self.notification_service = NotificationService(db)
    
    def create_comment(self, comment_data: CommentCreate, current_user: User) -> CommentResponse:
        """Create a new comment or reply."""
        if not has_permission(current_user, "comment:create"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to create comments"
            )
        
        # Verify post exists and is not locked
        post = self.post_repo.get_by_id(comment_data.post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        if post.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Post is locked. Cannot add comments."
            )
        
        # If it's a reply, verify parent comment exists
        if comment_data.parent_id:
            parent = self.comment_repo.get_by_id(comment_data.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found"
                )
            
            if parent.post_id != comment_data.post_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent comment does not belong to this post"
                )
        
        # Create comment
        comment = self.comment_repo.create(comment_data, current_user.id)
        
        # Create notification for post author (if not commenting on own post)
        if post.user_id != current_user.id:
            notification_data = NotificationCreate(
                user_id=post.user_id,
                type="new_comment",
                message=f"{current_user.username} commented on your post: {post.title[:50]}",
                link=f"/posts/{post.id}"
            )
            self.notification_service.create_notification(notification_data)
        
        # If it's a reply, notify the parent comment author
        if comment_data.parent_id and parent.user_id != current_user.id:
            notification_data = NotificationCreate(
                user_id=parent.user_id,
                type="reply",
                message=f"{current_user.username} replied to your comment",
                link=f"/posts/{post.id}#comment-{comment.id}"
            )
            self.notification_service.create_notification(notification_data)
        
        return self._comment_to_response(comment, current_user)
    
    def get_comment(self, comment_id: int, current_user: Optional[User] = None) -> CommentResponse:
        """Get comment by ID."""
        comment = self.comment_repo.get_by_id(comment_id)
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        return self._comment_to_response(comment, current_user)
    
    def get_post_comments(
        self,
        post_id: int,
        current_user: Optional[User] = None
    ) -> CommentTreeResponse:
        """Get all comments for a post in tree structure."""
        # Verify post exists
        post = self.post_repo.get_by_id(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        
        # Get top-level comments
        top_level_comments = self.comment_repo.get_by_post(post_id)
        
        # Build comment tree recursively
        comment_responses = []
        for comment in top_level_comments:
            comment_responses.append(self._build_comment_tree(comment, current_user))
        
        total = self.comment_repo.count_by_post(post_id)
        
        return CommentTreeResponse(
            comments=comment_responses,
            total=total
        )
    
    def update_comment(
        self,
        comment_id: int,
        comment_data: CommentUpdate,
        current_user: User
    ) -> CommentResponse:
        """Update a comment."""
        comment = self.comment_repo.get_by_id(comment_id)
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        # Check permissions
        if not check_resource_ownership(current_user, comment.user_id):
            if not has_permission(current_user, "comment:edit:any"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to edit this comment"
                )
        
        updated_comment = self.comment_repo.update(comment, comment_data)
        return self._comment_to_response(updated_comment, current_user)
    
    def delete_comment(self, comment_id: int, current_user: User) -> dict:
        """Delete a comment (soft delete)."""
        comment = self.comment_repo.get_by_id(comment_id)
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        # Check permissions
        if not check_resource_ownership(current_user, comment.user_id):
            if not has_permission(current_user, "comment:delete:any"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to delete this comment"
                )
        
        self.comment_repo.soft_delete(comment)
        return {"message": "Comment deleted successfully"}
    
    def vote_comment(
        self,
        comment_id: int,
        vote_type: str,
        current_user: User
    ) -> CommentResponse:
        """Vote on a comment."""
        if not has_permission(current_user, "vote:create"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to vote"
            )
        
        comment = self.comment_repo.get_by_id(comment_id)
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        self.comment_repo.create_vote(comment_id, current_user.id, vote_type)
        
        # Refresh comment to get updated vote counts
        updated_comment = self.comment_repo.get_by_id(comment_id)
        return self._comment_to_response(updated_comment, current_user)
    
    def remove_vote(self, comment_id: int, current_user: User) -> CommentResponse:
        """Remove vote from comment."""
        comment = self.comment_repo.get_by_id(comment_id)
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        self.comment_repo.remove_vote(comment_id, current_user.id)
        
        updated_comment = self.comment_repo.get_by_id(comment_id)
        return self._comment_to_response(updated_comment, current_user)
    
    def _comment_to_response(
        self,
        comment: Comment,
        current_user: Optional[User] = None
    ) -> CommentResponse:
        """Convert Comment model to CommentResponse schema."""
        # Get user's vote if authenticated
        user_vote = None
        if current_user:
            vote = self.comment_repo.get_user_vote(comment.id, current_user.id)
            if vote:
                user_vote = vote.vote_type
        
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            user_id=comment.user_id,
            parent_id=comment.parent_id,
            content=comment.content,
            upvotes=comment.upvotes,
            downvotes=comment.downvotes,
            is_deleted=comment.is_deleted,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            author_username=comment.author.username,
            author_avatar=comment.author.avatar_url,
            user_vote=user_vote,
            replies=[]  # Will be filled in _build_comment_tree
        )
    
    def _build_comment_tree(
        self,
        comment: Comment,
        current_user: Optional[User] = None
    ) -> CommentResponse:
        """Recursively build comment tree with replies."""
        comment_response = self._comment_to_response(comment, current_user)
        
        # Get replies
        replies = self.comment_repo.get_by_post(comment.post_id, parent_id=comment.id)
        
        # Recursively build reply trees
        comment_response.replies = [
            self._build_comment_tree(reply, current_user) for reply in replies
        ]
        
        return comment_response