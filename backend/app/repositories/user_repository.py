from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.logger import app_logger


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_data: UserCreate) -> User:
        """Create a new user."""
        user_count = self.db.query(User).count()

        role_id = 3 if user_count == 0 else 1

        user = User(
            firebase_uid=user_data.firebase_uid,
            email=user_data.email,
            username=user_data.username,
            avatar_url=user_data.avatar_url,
            role_id=role_id
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        role_name = "admin" if role_id == 3 else "user"
        app_logger.info(f"User created: {user.username} (ID: {user.id}, Role: {role_name})")
        return user

    def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).options(joinedload(User.role)).filter(User.id == user_id).first()

    def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        """Get user by Firebase UID."""
        return self.db.query(User).options(joinedload(User.role)).filter(
            User.firebase_uid == firebase_uid
        ).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).options(joinedload(User.role)).filter(
            User.email == email
        ).first()

    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.db.query(User).options(joinedload(User.role)).filter(
            User.username == username
        ).first()

    def update(self, user: User, user_data: UserUpdate) -> User:
        """Update user information."""
        update_data = user_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        app_logger.info(f"User updated: {user.username} (ID: {user.id})")
        return user

    def ban_user(self, user: User) -> User:
        """Ban a user."""
        user.is_banned = True
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        app_logger.warning(f"User banned: {user.username} (ID: {user.id})")
        return user

    def unban_user(self, user: User) -> User:
        """Unban a user."""
        user.is_banned = False
        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        app_logger.info(f"User unbanned: {user.username} (ID: {user.id})")
        return user

    def delete(self, user: User) -> None:
        """Delete a user."""
        username = user.username
        self.db.delete(user)
        self.db.commit()
        app_logger.warning(f"User deleted: {username}")