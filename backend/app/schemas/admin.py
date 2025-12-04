from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"


# User Management Schemas
class UserListItem(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    is_banned: bool
    created_at: datetime
    post_count: int = 0
    comment_count: int = 0

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int
    page: int
    page_size: int
    has_more: bool


class UserDetailResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role: str
    is_active: bool
    is_banned: bool
    ban_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    post_count: int = 0
    comment_count: int = 0

    class Config:
        from_attributes = True


class BanUserRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class ChangeRoleRequest(BaseModel):
    role: RoleEnum


class UserUpdateRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


# Post Management Schemas
class PostAdminListItem(BaseModel):
    id: int
    title: str
    author_username: str
    author_id: int
    is_locked: bool
    is_deleted: bool
    upvotes: int
    downvotes: int
    comment_count: int
    created_at: datetime
    reports_count: int = 0

    class Config:
        from_attributes = True


class PostAdminListResponse(BaseModel):
    posts: List[PostAdminListItem]
    total: int
    page: int
    page_size: int
    has_more: bool


class LockPostRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


# Comment Management Schemas
class CommentAdminListItem(BaseModel):
    id: int
    content: str
    author_username: str
    author_id: int
    post_id: int
    post_title: str
    is_deleted: bool
    upvotes: int
    downvotes: int
    created_at: datetime
    reports_count: int = 0

    class Config:
        from_attributes = True


class CommentAdminListResponse(BaseModel):
    comments: List[CommentAdminListItem]
    total: int
    page: int
    page_size: int
    has_more: bool


# Dashboard Schemas
class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    banned_users: int
    total_posts: int
    total_comments: int
    posts_today: int
    comments_today: int
    new_users_today: int


class RecentActivity(BaseModel):
    type: str  # 'user_joined', 'post_created', 'comment_created', 'user_banned'
    message: str
    timestamp: datetime
    user_id: Optional[int] = None
    post_id: Optional[int] = None


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_activity: List[RecentActivity]


# Role Management Schemas
class RoleInfo(BaseModel):
    id: int
    name: str
    permissions: List[str]
    user_count: int

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    roles: List[RoleInfo]


# Thread Ban Schemas
class ThreadBanRequest(BaseModel):
    user_id: int
    post_id: int
    reason: Optional[str] = Field(None, max_length=500)


class ThreadBanResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    banned_by_id: int
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Action Response
class ActionResponse(BaseModel):
    success: bool
    message: str