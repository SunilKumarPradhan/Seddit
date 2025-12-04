from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.models.user import User
from app.models.role import Role
from app.models.post import Post
from app.models.comment import Comment
from app.schemas.admin import (
    UserListItem, UserDetailResponse, DashboardStats, 
    RecentActivity, PostAdminListItem, CommentAdminListItem,
    RoleInfo
)


class AdminService:
    def __init__(self, db: Session):
        self.db = db

    # ==================== USER MANAGEMENT ====================
    
    def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        role_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[User], int]:
        """Get paginated list of users with filters."""
        query = self.db.query(User)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.username.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        # Apply role filter
        if role_filter:
            query = query.join(Role).filter(Role.name == role_filter)
        
        # Apply status filter
        if status_filter == "active":
            query = query.filter(User.is_active == True, User.is_banned == False)
        elif status_filter == "banned":
            query = query.filter(User.is_banned == True)
        elif status_filter == "inactive":
            query = query.filter(User.is_active == False)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        users = query.offset(offset).limit(page_size).all()
        
        return users, total

    def get_user_detail(self, user_id: int) -> Optional[User]:
        """Get detailed user information."""
        return self.db.query(User).filter(User.id == user_id).first()

    def ban_user(self, user_id: int, admin_id: int, reason: Optional[str] = None) -> Optional[User]:
        """Ban a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Prevent banning admins
        if user.role and user.role.name == "admin":
            raise ValueError("Cannot ban an admin user")
        
        # Prevent self-ban
        if user_id == admin_id:
            raise ValueError("Cannot ban yourself")
        
        user.is_banned = True
        user.ban_reason = reason
        user.banned_at = datetime.utcnow()
        user.banned_by_id = admin_id
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def unban_user(self, user_id: int) -> Optional[User]:
        """Unban a user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        user.is_banned = False
        user.ban_reason = None
        user.banned_at = None
        user.banned_by_id = None
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def change_user_role(self, user_id: int, new_role: str, admin_id: int) -> Optional[User]:
        """Change a user's role."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Prevent self-demotion for admins
        if user_id == admin_id and new_role != "admin":
            raise ValueError("Cannot demote yourself")
        
        # Get the new role
        role = self.db.query(Role).filter(Role.name == new_role).first()
        if not role:
            raise ValueError(f"Role '{new_role}' not found")
        
        user.role_id = role.id
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int, admin_id: int) -> bool:
        """Delete a user (soft delete by deactivating)."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Prevent self-deletion
        if user_id == admin_id:
            raise ValueError("Cannot delete yourself")
        
        # Prevent deleting admins
        if user.role and user.role.name == "admin":
            raise ValueError("Cannot delete an admin user")
        
        # Soft delete - deactivate and anonymize
        user.is_active = False
        user.is_banned = True
        user.email = f"deleted_{user.id}@deleted.local"
        user.username = f"deleted_user_{user.id}"
        
        self.db.commit()
        return True

    # ==================== POST MANAGEMENT ====================
    
    def get_posts_admin(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Post], int]:
        """Get paginated list of posts for admin."""
        query = self.db.query(Post)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(Post.title.ilike(search_term))
        
        # Apply status filter
        if status_filter == "locked":
            query = query.filter(Post.is_locked == True)
        elif status_filter == "deleted":
            query = query.filter(Post.is_deleted == True)
        elif status_filter == "active":
            query = query.filter(Post.is_locked == False, Post.is_deleted == False)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(Post, sort_by, Post.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        posts = query.offset(offset).limit(page_size).all()
        
        return posts, total

    def lock_post(self, post_id: int, reason: Optional[str] = None) -> Optional[Post]:
        """Lock a post to prevent new comments."""
        post = self.db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return None
        
        post.is_locked = True
        post.lock_reason = reason
        post.locked_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(post)
        return post

    def unlock_post(self, post_id: int) -> Optional[Post]:
        """Unlock a post."""
        post = self.db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return None
        
        post.is_locked = False
        post.lock_reason = None
        post.locked_at = None
        
        self.db.commit()
        self.db.refresh(post)
        return post

    def delete_post_admin(self, post_id: int) -> bool:
        """Admin delete a post (soft delete)."""
        post = self.db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return False
        
        post.is_deleted = True
        post.deleted_at = datetime.utcnow()
        
        self.db.commit()
        return True

    def restore_post(self, post_id: int) -> Optional[Post]:
        """Restore a deleted post."""
        post = self.db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return None
        
        post.is_deleted = False
        post.deleted_at = None
        
        self.db.commit()
        self.db.refresh(post)
        return post

    # ==================== COMMENT MANAGEMENT ====================
    
    def get_comments_admin(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        post_id: Optional[int] = None,
        status_filter: Optional[str] = None
    ) -> Tuple[List[Comment], int]:
        """Get paginated list of comments for admin."""
        query = self.db.query(Comment)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(Comment.content.ilike(search_term))
        
        # Filter by post
        if post_id:
            query = query.filter(Comment.post_id == post_id)
        
        # Apply status filter
        if status_filter == "deleted":
            query = query.filter(Comment.is_deleted == True)
        elif status_filter == "active":
            query = query.filter(Comment.is_deleted == False)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and sorting
        offset = (page - 1) * page_size
        comments = query.order_by(Comment.created_at.desc()).offset(offset).limit(page_size).all()
        
        return comments, total

    def delete_comment_admin(self, comment_id: int) -> bool:
        """Admin delete a comment (soft delete)."""
        comment = self.db.query(Comment).filter(Comment.id == comment_id).first()
        if not comment:
            return False
        
        comment.is_deleted = True
        comment.content = "[Comment deleted by moderator]"
        
        self.db.commit()
        return True

    # ==================== DASHBOARD ====================
    
    def get_dashboard_stats(self) -> DashboardStats:
        """Get dashboard statistics."""
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(
            User.is_active == True, 
            User.is_banned == False
        ).count()
        banned_users = self.db.query(User).filter(User.is_banned == True).count()
        total_posts = self.db.query(Post).filter(Post.is_deleted == False).count()
        total_comments = self.db.query(Comment).filter(Comment.is_deleted == False).count()
        
        posts_today = self.db.query(Post).filter(
            Post.created_at >= today_start,
            Post.is_deleted == False
        ).count()
        
        comments_today = self.db.query(Comment).filter(
            Comment.created_at >= today_start,
            Comment.is_deleted == False
        ).count()
        
        new_users_today = self.db.query(User).filter(
            User.created_at >= today_start
        ).count()
        
        return DashboardStats(
            total_users=total_users,
            active_users=active_users,
            banned_users=banned_users,
            total_posts=total_posts,
            total_comments=total_comments,
            posts_today=posts_today,
            comments_today=comments_today,
            new_users_today=new_users_today
        )

    def get_recent_activity(self, limit: int = 10) -> List[RecentActivity]:
        """Get recent activity for dashboard."""
        activities = []
        
        # Recent users
        recent_users = self.db.query(User).order_by(
            User.created_at.desc()
        ).limit(5).all()
        
        for user in recent_users:
            activities.append(RecentActivity(
                type="user_joined",
                message=f"New user joined: {user.username}",
                timestamp=user.created_at,
                user_id=user.id
            ))
        
        # Recent posts
        recent_posts = self.db.query(Post).filter(
            Post.is_deleted == False
        ).order_by(Post.created_at.desc()).limit(5).all()
        
        for post in recent_posts:
            activities.append(RecentActivity(
                type="post_created",
                message=f"New post: {post.title[:50]}...",
                timestamp=post.created_at,
                user_id=post.user_id,
                post_id=post.id
            ))
        
        # Sort by timestamp and limit
        activities.sort(key=lambda x: x.timestamp, reverse=True)
        return activities[:limit]

    # ==================== ROLE MANAGEMENT ====================
    
    def get_roles(self) -> List[RoleInfo]:
        """Get all roles with user counts."""
        roles = self.db.query(Role).all()
        result = []
        
        for role in roles:
            user_count = self.db.query(User).filter(User.role_id == role.id).count()
            result.append(RoleInfo(
                id=role.id,
                name=role.name,
                permissions=role.permissions or [],
                user_count=user_count
            ))
        
        return result

    def get_user_count_by_role(self, role_name: str) -> int:
        """Get count of users with a specific role."""
        return self.db.query(User).join(Role).filter(Role.name == role_name).count()