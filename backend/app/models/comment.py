from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    
    content = Column(Text, nullable=False)
    
    upvotes = Column(Integer, default=0, nullable=False)
    downvotes = Column(Integer, default=0, nullable=False)
    
    is_deleted = Column(Boolean, default=False, nullable=False)  # Soft delete
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")
    
    # Self-referential for nested comments
    replies = relationship(
        "Comment",
        backref="parent",
        remote_side=[id],
        cascade="all, delete-orphan",
        single_parent=True,        # <-- add this line
    )
    
    votes = relationship("Vote", back_populates="comment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Comment {self.id} on Post {self.post_id}>"