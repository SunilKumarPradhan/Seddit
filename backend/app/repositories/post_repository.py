from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_
from app.models.post import Post, Vote, Favorite
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate
from app.utils.logger import app_logger


class PostRepository:
    """Repository for Post database operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, post_data: PostCreate, user_id: int) -> Post:
        """Create a new post."""
        post = Post(
            user_id=user_id,
            title=post_data.title,
            description=post_data.description,
            tag=post_data.tag,
            image_url=post_data.image_url
        )
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        app_logger.info(f"Post created: ID {post.id} by user {user_id}")
        return post
    
    def get_by_id(self, post_id: int, include_deleted: bool = False) -> Optional[Post]:
        """Get post by ID."""
        query = self.db.query(Post).options(joinedload(Post.author)).filter(Post.id == post_id)
        
        if not include_deleted:
            query = query.filter(Post.is_deleted == False)
        
        return query.first()
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        tag: Optional[str] = None,
        user_id: Optional[int] = None,
        sort_by: str = "new"
    ) -> List[Post]:
        """Get all posts with filters and pagination."""
        query = self.db.query(Post).options(joinedload(Post.author)).filter(
            Post.is_deleted == False
        )
        
        # Filter by tag
        if tag:
            query = query.filter(Post.tag == tag)
        
        # Filter by user
        if user_id:
            query = query.filter(Post.user_id == user_id)
        
        # Sorting
        if sort_by == "new":
            query = query.order_by(desc(Post.created_at))
        elif sort_by == "hot":
            # Simple hot algorithm: (upvotes - downvotes) / age
            query = query.order_by(desc(Post.upvotes - Post.downvotes))
        elif sort_by == "top":
            query = query.order_by(desc(Post.upvotes))
        
        return query.offset(skip).limit(limit).all()
    
    def count_all(self, tag: Optional[str] = None, user_id: Optional[int] = None) -> int:
        """Count total posts with filters."""
        query = self.db.query(Post).filter(Post.is_deleted == False)
        
        if tag:
            query = query.filter(Post.tag == tag)
        
        if user_id:
            query = query.filter(Post.user_id == user_id)
        
        return query.count()
    
    def search(self, query_text: str, skip: int = 0, limit: int = 20) -> List[Post]:
        """Search posts by title or description."""
        search_filter = or_(
            Post.title.ilike(f"%{query_text}%"),
            Post.description.ilike(f"%{query_text}%")
        )
        
        return self.db.query(Post).options(joinedload(Post.author)).filter(
            Post.is_deleted == False,
            search_filter
        ).order_by(desc(Post.created_at)).offset(skip).limit(limit).all()
    
    def update(self, post: Post, post_data: PostUpdate) -> Post:
        """Update post."""
        update_data = post_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(post, field, value)
        
        self.db.commit()
        self.db.refresh(post)
        app_logger.info(f"Post updated: ID {post.id}")
        return post
    
    def soft_delete(self, post: Post) -> Post:
        """Soft delete post."""
        post.is_deleted = True
        self.db.commit()
        self.db.refresh(post)
        app_logger.info(f"Post soft deleted: ID {post.id}")
        return post
    
    def lock_post(self, post: Post) -> Post:
        """Lock post (prevent new comments)."""
        post.is_locked = True
        self.db.commit()
        self.db.refresh(post)
        app_logger.info(f"Post locked: ID {post.id}")
        return post
    
    def unlock_post(self, post: Post) -> Post:
        """Unlock post."""
        post.is_locked = False
        self.db.commit()
        self.db.refresh(post)
        app_logger.info(f"Post unlocked: ID {post.id}")
        return post
    
    # Vote operations
    def get_user_vote(self, post_id: int, user_id: int) -> Optional[Vote]:
        """Get user's vote on a post."""
        return self.db.query(Vote).filter(
            Vote.post_id == post_id,
            Vote.user_id == user_id
        ).first()
    
    def create_vote(self, post_id: int, user_id: int, vote_type: str) -> Vote:
        """Create or update vote."""
        # Check if vote already exists
        existing_vote = self.get_user_vote(post_id, user_id)
        
        if existing_vote:
            # Update existing vote
            old_type = existing_vote.vote_type
            existing_vote.vote_type = vote_type
            
            # Update post vote counts
            post = self.get_by_id(post_id, include_deleted=True)
            if old_type == "up":
                post.upvotes -= 1
            else:
                post.downvotes -= 1
            
            if vote_type == "up":
                post.upvotes += 1
            else:
                post.downvotes += 1
            
            self.db.commit()
            return existing_vote
        
        # Create new vote
        vote = Vote(post_id=post_id, user_id=user_id, vote_type=vote_type)
        self.db.add(vote)
        
        # Update post vote counts
        post = self.get_by_id(post_id, include_deleted=True)
        if vote_type == "up":
            post.upvotes += 1
        else:
            post.downvotes += 1
        
        self.db.commit()
        self.db.refresh(vote)
        app_logger.info(f"Vote created: {vote_type} on post {post_id} by user {user_id}")
        return vote
    
    def remove_vote(self, post_id: int, user_id: int) -> None:
        """Remove vote."""
        vote = self.get_user_vote(post_id, user_id)
        if vote:
            # Update post vote counts
            post = self.get_by_id(post_id, include_deleted=True)
            if vote.vote_type == "up":
                post.upvotes -= 1
            else:
                post.downvotes -= 1
            
            self.db.delete(vote)
            self.db.commit()
            app_logger.info(f"Vote removed from post {post_id} by user {user_id}")
    
    # Favorite operations
    def add_favorite(self, post_id: int, user_id: int) -> Favorite:
        """Add post to favorites."""
        existing = self.db.query(Favorite).filter(
            Favorite.post_id == post_id,
            Favorite.user_id == user_id
        ).first()
        
        if existing:
            return existing
        
        favorite = Favorite(post_id=post_id, user_id=user_id)
        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)
        app_logger.info(f"Post {post_id} favorited by user {user_id}")
        return favorite
    
    def remove_favorite(self, post_id: int, user_id: int) -> None:
        """Remove post from favorites."""
        favorite = self.db.query(Favorite).filter(
            Favorite.post_id == post_id,
            Favorite.user_id == user_id
        ).first()
        
        if favorite:
            self.db.delete(favorite)
            self.db.commit()
            app_logger.info(f"Post {post_id} unfavorited by user {user_id}")
    
    def is_favorited(self, post_id: int, user_id: int) -> bool:
        """Check if post is favorited by user."""
        return self.db.query(Favorite).filter(
            Favorite.post_id == post_id,
            Favorite.user_id == user_id
        ).first() is not None
    
    def get_user_favorites(self, user_id: int, skip: int = 0, limit: int = 20) -> List[Post]:
        """Get user's favorite posts."""
        return self.db.query(Post).join(Favorite).options(joinedload(Post.author)).filter(
            Favorite.user_id == user_id,
            Post.is_deleted == False
        ).order_by(desc(Favorite.created_at)).offset(skip).limit(limit).all()