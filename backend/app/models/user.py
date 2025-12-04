from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base  # Changed from app.core.database


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)

    role_id = Column(Integer, ForeignKey("roles.id"), default=3)

    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)

    ban_reason = Column(String(500), nullable=True)
    banned_at = Column(DateTime, nullable=True)
    banned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role = relationship("Role", back_populates="users")
    posts = relationship("Post", back_populates="author", foreign_keys="Post.user_id")
    comments = relationship("Comment", back_populates="author", foreign_keys="Comment.user_id")
    notifications = relationship("Notification", back_populates="user")
    banned_by = relationship("User", remote_side=[id], foreign_keys=[banned_by_id])

    def __repr__(self):
        return f"<User {self.username}>"