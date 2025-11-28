from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.models.comment import Comment
from app.models.post import Vote
from app.schemas.comment import CommentCreate, CommentUpdate
from app.utils.logger import app_logger


class CommentRepository:
    """Repository for Comment database operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, comment_data: CommentCreate, user_id: int) -> Comment:
        """Create a new comment."""
        comment = Comment(
            post_id=comment_data.post_id,
            user_id=user_id,
            parent_id=comment_data.parent_id,
            content=comment_data.content
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        app_logger.info(f"Comment created: ID {comment.id} on post {comment.post_id}")
        return comment
    
    def get_by_id(self, comment_id: int, include_deleted: bool = False) -> Optional[Comment]:
        """Get comment by ID."""
        query = self.db.query(Comment).options(joinedload(Comment.author)).filter(
            Comment.id == comment_id
        )
        
        if not include_deleted:
            query = query.filter(Comment.is_deleted == False)
        
        return query.first()
    
    def get_by_post(self, post_id: int, parent_id: Optional[int] = None) -> List[Comment]:
        """Get comments for a post (optionally filtered by parent)."""
        query = self.db.query(Comment).options(joinedload(Comment.author)).filter(
            Comment.post_id == post_id,
            Comment.is_deleted == False
        )
        
        if parent_id is not None:
            query = query.filter(Comment.parent_id == parent_id)
        else:
            # Get only top-level comments
            query = query.filter(Comment.parent_id.is_(None))
        
        return query.order_by(Comment.created_at).all()
    
    def get_comment_tree(self, post_id: int) -> List[Comment]:
        """Get nested comment tree for a post using recursive query."""
        # Use PostgreSQL recursive CTE for nested comments
        from sqlalchemy import text
        
        query = text("""
            WITH RECURSIVE comment_tree AS (
                -- Base case: top-level comments
                SELECT c.*, u.username as author_username, u.avatar_url as author_avatar
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = :post_id AND c.parent_id IS NULL AND c.is_deleted = FALSE
                
                UNION ALL
                
                -- Recursive case: child comments
                SELECT c.*, u.username as author_username, u.avatar_url as author_avatar
                FROM comments c
                JOIN users u ON c.user_id = u.id
                INNER JOIN comment_tree ct ON c.parent_id = ct.id
                WHERE c.is_deleted = FALSE
            )
            SELECT * FROM comment_tree ORDER BY created_at;
        """)
        
        result = self.db.execute(query, {"post_id": post_id})
        return result.fetchall()
    
    def count_by_post(self, post_id: int) -> int:
        """Count comments on a post."""
        return self.db.query(Comment).filter(
            Comment.post_id == post_id,
            Comment.is_deleted == False
        ).count()
    
    def update(self, comment: Comment, comment_data: CommentUpdate) -> Comment:
        """Update comment."""
        comment.content = comment_data.content
        self.db.commit()
        self.db.refresh(comment)
        app_logger.info(f"Comment updated: ID {comment.id}")
        return comment
    
    def soft_delete(self, comment: Comment) -> Comment:
        """Soft delete comment."""
        comment.is_deleted = True
        comment.content = "[deleted]"
        self.db.commit()
        self.db.refresh(comment)
        app_logger.info(f"Comment soft deleted: ID {comment.id}")
        return comment
    
    # Vote operations
    def get_user_vote(self, comment_id: int, user_id: int) -> Optional[Vote]:
        """Get user's vote on a comment."""
        return self.db.query(Vote).filter(
            Vote.comment_id == comment_id,
            Vote.user_id == user_id
        ).first()
    
    def create_vote(self, comment_id: int, user_id: int, vote_type: str) -> Vote:
        """Create or update vote on comment."""
        existing_vote = self.get_user_vote(comment_id, user_id)
        
        if existing_vote:
            old_type = existing_vote.vote_type
            existing_vote.vote_type = vote_type
            
            comment = self.get_by_id(comment_id, include_deleted=True)
            if old_type == "up":
                comment.upvotes -= 1
            else:
                comment.downvotes -= 1
            
            if vote_type == "up":
                comment.upvotes += 1
            else:
                comment.downvotes += 1
            
            self.db.commit()
            return existing_vote
        
        vote = Vote(comment_id=comment_id, user_id=user_id, vote_type=vote_type)
        self.db.add(vote)
        
        comment = self.get_by_id(comment_id, include_deleted=True)
        if vote_type == "up":
            comment.upvotes += 1
        else:
            comment.downvotes += 1
        
        self.db.commit()
        self.db.refresh(vote)
        app_logger.info(f"Vote created: {vote_type} on comment {comment_id}")
        return vote
    
    def remove_vote(self, comment_id: int, user_id: int) -> None:
        """Remove vote from comment."""
        vote = self.get_user_vote(comment_id, user_id)
        if vote:
            comment = self.get_by_id(comment_id, include_deleted=True)
            if vote.vote_type == "up":
                comment.upvotes -= 1
            else:
                comment.downvotes -= 1
            
            self.db.delete(vote)
            self.db.commit()
            app_logger.info(f"Vote removed from comment {comment_id}")