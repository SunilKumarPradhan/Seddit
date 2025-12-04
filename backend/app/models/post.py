from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base  # Changed from app.core.database


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    tag = Column(String(50), nullable=True, index=True)
    image_url = Column(Text, nullable=True)

    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)

    is_locked = Column(Boolean, default=False)
    lock_reason = Column(String(500), nullable=True)
    locked_at = Column(DateTime, nullable=True)

    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="posts", foreign_keys=[user_id])
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="post", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Post {self.id}: {self.title[:30]}>"


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    vote_type = Column(String(10), nullable=False)  # 'up' or 'down'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    post = relationship("Post", back_populates="votes")
    comment = relationship("Comment", back_populates="votes")

    def __repr__(self):
        return f"<Vote {self.vote_type} by user {self.user_id}>"


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    post = relationship("Post", back_populates="favorites")

    def __repr__(self):
        return f"<Favorite post {self.post_id} by user {self.user_id}>"