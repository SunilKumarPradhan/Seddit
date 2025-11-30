from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.post import Post, Favorite
from app.models.user import User
from app.schemas.post import (
    PostCreate, PostUpdate, PostResponse, PostListResponse, VoteCreate
)
from app.repositories.post_repository import PostRepository
from app.repositories.comment_repository import CommentRepository
from app.core.permissions import has_permission, check_resource_ownership
from app.utils.logger import app_logger

class PostService:
    """Service for post operations."""

    def __init__(self, db: Session):
        self.db = db
        self.post_repo = PostRepository(db)
        self.comment_repo = CommentRepository(db)

    def create_post(self, post_data: PostCreate, current_user: User) -> PostResponse:
        """Create a new post."""
        if not has_permission(current_user, "post:create"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to create posts"
            )

        post = self.post_repo.create(post_data, current_user.id)
        return self._post_to_response(post, current_user)

    def get_post(self, post_id: int, current_user: Optional[User] = None) -> PostResponse:
        """Get post by ID."""
        post = self.post_repo.get_by_id(post_id)

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        return self._post_to_response(post, current_user)

    def get_posts(
        self,
        page: int = 1,
        page_size: int = 20,
        tag: Optional[str] = None,
        sort_by: str = "new",
        current_user: Optional[User] = None
    ) -> PostListResponse:
        """Get paginated list of posts."""
        skip = (page - 1) * page_size

        posts = self.post_repo.get_all(
            skip=skip,
            limit=page_size,
            tag=tag,
            sort_by=sort_by
        )

        total = self.post_repo.count_all(tag=tag)

        post_responses = [self._post_to_response(post, current_user) for post in posts]

        return PostListResponse(
            posts=post_responses,
            total=total,
            page=page,
            page_size=page_size,
            has_more=skip + page_size < total
        )

    def get_favorites(
        self,
        page: int = 1,
        page_size: int = 20,
        current_user: User = None
    ) -> PostListResponse:
        """Get user's favorite posts."""
        skip = (page - 1) * page_size

        # Get paginated favorite posts
        posts = self.post_repo.get_user_favorites(
            user_id=current_user.id,
            skip=skip,
            limit=page_size
        )

        # Count total favorites - Simple direct count
        total = self.db.query(Favorite).filter(
            Favorite.user_id == current_user.id
        ).count()

        # Convert to response format
        post_responses = [self._post_to_response(post, current_user) for post in posts]

        return PostListResponse(
            posts=post_responses,
            total=total,
            page=page,
            page_size=page_size,
            has_more=skip + page_size < total
        )

    def get_user_posts(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        current_user: Optional[User] = None
    ) -> PostListResponse:
        """Get posts by specific user."""
        skip = (page - 1) * page_size

        posts = self.post_repo.get_all(
            skip=skip,
            limit=page_size,
            user_id=user_id,
            sort_by="new"
        )

        total = self.post_repo.count_all(user_id=user_id)

        post_responses = [self._post_to_response(post, current_user) for post in posts]

        return PostListResponse(
            posts=post_responses,
            total=total,
            page=page,
            page_size=page_size,
            has_more=skip + page_size < total
        )

    def update_post(
        self,
        post_id: int,
        post_data: PostUpdate,
        current_user: User
    ) -> PostResponse:
        """Update a post."""
        post = self.post_repo.get_by_id(post_id)

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        if not check_resource_ownership(current_user, post.user_id):
            if not has_permission(current_user, "post:edit:any"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to edit this post"
                )

        updated_post = self.post_repo.update(post, post_data)
        return self._post_to_response(updated_post, current_user)

    def delete_post(self, post_id: int, current_user: User) -> dict:
        """Delete a post."""
        post = self.post_repo.get_by_id(post_id)

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        if not check_resource_ownership(current_user, post.user_id):
            if not has_permission(current_user, "post:delete:any"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to delete this post"
                )

        self.post_repo.soft_delete(post)
        return {"message": "Post deleted successfully"}

    def vote_post(self, post_id: int, vote_data: VoteCreate, current_user: User) -> PostResponse:
        """Vote on a post."""
        if not has_permission(current_user, "vote:create"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to vote"
            )

        post = self.post_repo.get_by_id(post_id)

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        self.post_repo.create_vote(post_id, current_user.id, vote_data.vote_type)

        updated_post = self.post_repo.get_by_id(post_id)
        return self._post_to_response(updated_post, current_user)

    def remove_vote(self, post_id: int, current_user: User) -> PostResponse:
        """Remove vote from post."""
        post = self.post_repo.get_by_id(post_id)

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        self.post_repo.remove_vote(post_id, current_user.id)

        updated_post = self.post_repo.get_by_id(post_id)
        return self._post_to_response(updated_post, current_user)

    def add_favorite(self, post_id: int, current_user: User) -> dict:
        """Add post to favorites."""
        post = self.post_repo.get_by_id(post_id)

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        # Check if already favorited
        if self.post_repo.is_favorited(post_id, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post already favorited"
            )

        self.post_repo.add_favorite(post_id, current_user.id)
        app_logger.info(f"Post {post_id} favorited by user {current_user.id}")
        
        return {
            "message": "Post added to favorites",
            "is_favorited": True
        }

    def remove_favorite(self, post_id: int, current_user: User) -> dict:
        """Remove post from favorites."""
        post = self.post_repo.get_by_id(post_id)

        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )

        # Check if not favorited
        if not self.post_repo.is_favorited(post_id, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post not in favorites"
            )

        self.post_repo.remove_favorite(post_id, current_user.id)
        app_logger.info(f"Post {post_id} unfavorited by user {current_user.id}")
        
        return {
            "message": "Post removed from favorites",
            "is_favorited": False
        }

    def _post_to_response(self, post: Post, current_user: Optional[User] = None) -> PostResponse:
        """Convert Post model to PostResponse schema."""
        comment_count = self.comment_repo.count_by_post(post.id)

        user_vote = None
        is_favorited = False

        if current_user:
            vote = self.post_repo.get_user_vote(post.id, current_user.id)
            if vote:
                user_vote = vote.vote_type

            is_favorited = self.post_repo.is_favorited(post.id, current_user.id)

        return PostResponse(
            id=post.id,
            user_id=post.user_id,
            title=post.title,
            description=post.description,
            tag=post.tag,
            image_url=post.image_url,
            upvotes=post.upvotes,
            downvotes=post.downvotes,
            is_locked=post.is_locked,
            is_deleted=post.is_deleted,
            created_at=post.created_at,
            updated_at=post.updated_at,
            author_username=post.author.username,
            author_avatar=post.author.avatar_url,
            comment_count=comment_count,
            user_vote=user_vote,
            is_favorited=is_favorited
        )