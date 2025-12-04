from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db  # Changed from app.core.database
from app.dependencies import get_current_user  # Changed from app.core.security
from app.core.permissions import (
    get_admin_user, get_moderator_user,
    Permissions, has_permission, is_admin, ROLE_PERMISSIONS, get_user_role
)
from app.models.user import User
from app.services.admin_service import AdminService
from app.schemas.admin import (
    UserListResponse, UserListItem, UserDetailResponse,
    BanUserRequest, ChangeRoleRequest, ActionResponse,
    PostAdminListResponse, PostAdminListItem, LockPostRequest,
    CommentAdminListResponse, CommentAdminListItem,
    DashboardResponse, RoleListResponse
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/me/permissions")
async def get_my_permissions(
    current_user: User = Depends(get_current_user)
):
    """Get current user's role and permissions."""
    role = get_user_role(current_user)
    permissions = ROLE_PERMISSIONS.get(role, [])

    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "role": role,
        "permissions": permissions,
        "is_admin": role == "admin",
        "is_moderator": role in ["admin", "moderator"]
    }


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard data."""
    service = AdminService(db)
    stats = service.get_dashboard_stats()
    activity = service.get_recent_activity()

    return DashboardResponse(stats=stats, recent_activity=activity)


@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get paginated list of users (Admin only)."""
    service = AdminService(db)
    users, total = service.get_users(
        page=page,
        page_size=page_size,
        search=search,
        role_filter=role,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order
    )

    user_items = []
    for user in users:
        post_count = len(user.posts) if hasattr(user, 'posts') and user.posts else 0
        comment_count = len(user.comments) if hasattr(user, 'comments') and user.comments else 0

        user_items.append(UserListItem(
            id=user.id,
            username=user.username,
            email=user.email,
            avatar_url=user.avatar_url,
            role=user.role.name if user.role else "user",
            is_active=user.is_active,
            is_banned=user.is_banned,
            created_at=user.created_at,
            post_count=post_count,
            comment_count=comment_count
        ))

    return UserListResponse(
        users=user_items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get detailed user information (Admin only)."""
    service = AdminService(db)
    user = service.get_user_detail(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    post_count = len(user.posts) if hasattr(user, 'posts') and user.posts else 0
    comment_count = len(user.comments) if hasattr(user, 'comments') and user.comments else 0

    return UserDetailResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        bio=user.bio,
        role=user.role.name if user.role else "user",
        is_active=user.is_active,
        is_banned=user.is_banned,
        ban_reason=getattr(user, 'ban_reason', None),
        created_at=user.created_at,
        updated_at=user.updated_at,
        post_count=post_count,
        comment_count=comment_count
    )


@router.post("/users/{user_id}/ban", response_model=ActionResponse)
async def ban_user(
    user_id: int,
    request: BanUserRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Ban a user (Admin only)."""
    service = AdminService(db)

    try:
        user = service.ban_user(user_id, current_user.id, request.reason)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return ActionResponse(
            success=True,
            message=f"User {user.username} has been banned"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/users/{user_id}/unban", response_model=ActionResponse)
async def unban_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Unban a user (Admin only)."""
    service = AdminService(db)
    user = service.unban_user(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return ActionResponse(
        success=True,
        message=f"User {user.username} has been unbanned"
    )


@router.post("/users/{user_id}/role", response_model=ActionResponse)
async def change_user_role(
    user_id: int,
    request: ChangeRoleRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Change a user's role (Admin only)."""
    service = AdminService(db)

    try:
        user = service.change_user_role(user_id, request.role.value, current_user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return ActionResponse(
            success=True,
            message=f"User {user.username} role changed to {request.role.value}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/users/{user_id}", response_model=ActionResponse)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (Admin only)."""
    service = AdminService(db)

    try:
        success = service.delete_user(user_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return ActionResponse(
            success=True,
            message="User has been deleted"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/posts", response_model=PostAdminListResponse)
async def get_posts_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_moderator_user),
    db: Session = Depends(get_db)
):
    """Get paginated list of posts for moderation."""
    service = AdminService(db)
    posts, total = service.get_posts_admin(
        page=page,
        page_size=page_size,
        search=search,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order
    )

    post_items = []
    for post in posts:
        comment_count = post.comment_count if hasattr(post, 'comment_count') else 0
        post_items.append(PostAdminListItem(
            id=post.id,
            title=post.title,
            author_username=post.author.username if post.author else "Unknown",
            author_id=post.user_id,
            is_locked=post.is_locked,
            is_deleted=post.is_deleted,
            upvotes=post.upvotes,
            downvotes=post.downvotes,
            comment_count=comment_count,
            created_at=post.created_at,
            reports_count=0
        ))

    return PostAdminListResponse(
        posts=post_items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )


@router.post("/posts/{post_id}/lock", response_model=ActionResponse)
async def lock_post(
    post_id: int,
    request: LockPostRequest,
    current_user: User = Depends(get_moderator_user),
    db: Session = Depends(get_db)
):
    """Lock a post to prevent new comments."""
    service = AdminService(db)
    post = service.lock_post(post_id, request.reason)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return ActionResponse(
        success=True,
        message=f"Post '{post.title}' has been locked"
    )


@router.post("/posts/{post_id}/unlock", response_model=ActionResponse)
async def unlock_post(
    post_id: int,
    current_user: User = Depends(get_moderator_user),
    db: Session = Depends(get_db)
):
    """Unlock a post."""
    service = AdminService(db)
    post = service.unlock_post(post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return ActionResponse(
        success=True,
        message=f"Post '{post.title}' has been unlocked"
    )


@router.delete("/posts/{post_id}", response_model=ActionResponse)
async def delete_post_admin(
    post_id: int,
    current_user: User = Depends(get_moderator_user),
    db: Session = Depends(get_db)
):
    """Delete a post (moderator action)."""
    service = AdminService(db)
    success = service.delete_post_admin(post_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return ActionResponse(
        success=True,
        message="Post has been deleted"
    )


@router.post("/posts/{post_id}/restore", response_model=ActionResponse)
async def restore_post(
    post_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Restore a deleted post (Admin only)."""
    service = AdminService(db)
    post = service.restore_post(post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return ActionResponse(
        success=True,
        message=f"Post '{post.title}' has been restored"
    )


@router.get("/comments", response_model=CommentAdminListResponse)
async def get_comments_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    post_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_moderator_user),
    db: Session = Depends(get_db)
):
    """Get paginated list of comments for moderation."""
    service = AdminService(db)
    comments, total = service.get_comments_admin(
        page=page,
        page_size=page_size,
        search=search,
        post_id=post_id,
        status_filter=status
    )

    comment_items = []
    for comment in comments:
        comment_items.append(CommentAdminListItem(
            id=comment.id,
            content=comment.content[:200] + "..." if len(comment.content) > 200 else comment.content,
            author_username=comment.author.username if comment.author else "Unknown",
            author_id=comment.user_id,
            post_id=comment.post_id,
            post_title=comment.post.title if comment.post else "Unknown",
            is_deleted=comment.is_deleted,
            upvotes=comment.upvotes,
            downvotes=comment.downvotes,
            created_at=comment.created_at,
            reports_count=0
        ))

    return CommentAdminListResponse(
        comments=comment_items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total
    )


@router.delete("/comments/{comment_id}", response_model=ActionResponse)
async def delete_comment_admin(
    comment_id: int,
    current_user: User = Depends(get_moderator_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (moderator action)."""
    service = AdminService(db)
    success = service.delete_comment_admin(comment_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    return ActionResponse(
        success=True,
        message="Comment has been deleted"
    )


@router.get("/roles", response_model=RoleListResponse)
async def get_roles(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all roles with user counts (Admin only)."""
    service = AdminService(db)
    roles = service.get_roles()

    return RoleListResponse(roles=roles)