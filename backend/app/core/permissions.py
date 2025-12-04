from functools import wraps
from typing import Callable, List, Optional
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.database import get_db  # Changed from app.core.database
from app.dependencies import get_current_user  # Changed from app.core.security
from app.models.user import User


class Permissions:
    # User permissions
    CREATE_POST = "create_post"
    EDIT_OWN_POST = "edit_own_post"
    DELETE_OWN_POST = "delete_own_post"
    CREATE_COMMENT = "create_comment"
    EDIT_OWN_COMMENT = "edit_own_comment"
    DELETE_OWN_COMMENT = "delete_own_comment"
    VOTE = "vote"
    FAVORITE = "favorite"

    # Moderator permissions
    DELETE_ANY_POST = "delete_any_post"
    DELETE_ANY_COMMENT = "delete_any_comment"
    LOCK_POST = "lock_post"
    UNLOCK_POST = "unlock_post"
    BAN_USER_FROM_THREAD = "ban_user_from_thread"
    VIEW_REPORTS = "view_reports"

    # Admin permissions
    BAN_USER = "ban_user"
    UNBAN_USER = "unban_user"
    PROMOTE_USER = "promote_user"
    DEMOTE_USER = "demote_user"
    DELETE_USER = "delete_user"
    VIEW_ALL_USERS = "view_all_users"
    MANAGE_ROLES = "manage_roles"
    VIEW_ADMIN_DASHBOARD = "view_admin_dashboard"
    MANAGE_CATEGORIES = "manage_categories"


ROLE_PERMISSIONS = {
    "admin": [
        Permissions.CREATE_POST,
        Permissions.EDIT_OWN_POST,
        Permissions.DELETE_OWN_POST,
        Permissions.CREATE_COMMENT,
        Permissions.EDIT_OWN_COMMENT,
        Permissions.DELETE_OWN_COMMENT,
        Permissions.VOTE,
        Permissions.FAVORITE,
        Permissions.DELETE_ANY_POST,
        Permissions.DELETE_ANY_COMMENT,
        Permissions.LOCK_POST,
        Permissions.UNLOCK_POST,
        Permissions.BAN_USER_FROM_THREAD,
        Permissions.VIEW_REPORTS,
        Permissions.BAN_USER,
        Permissions.UNBAN_USER,
        Permissions.PROMOTE_USER,
        Permissions.DEMOTE_USER,
        Permissions.DELETE_USER,
        Permissions.VIEW_ALL_USERS,
        Permissions.MANAGE_ROLES,
        Permissions.VIEW_ADMIN_DASHBOARD,
        Permissions.MANAGE_CATEGORIES,
    ],
    "moderator": [
        Permissions.CREATE_POST,
        Permissions.EDIT_OWN_POST,
        Permissions.DELETE_OWN_POST,
        Permissions.CREATE_COMMENT,
        Permissions.EDIT_OWN_COMMENT,
        Permissions.DELETE_OWN_COMMENT,
        Permissions.VOTE,
        Permissions.FAVORITE,
        Permissions.DELETE_ANY_POST,
        Permissions.DELETE_ANY_COMMENT,
        Permissions.LOCK_POST,
        Permissions.UNLOCK_POST,
        Permissions.BAN_USER_FROM_THREAD,
        Permissions.VIEW_REPORTS,
    ],
    "user": [
        Permissions.CREATE_POST,
        Permissions.EDIT_OWN_POST,
        Permissions.DELETE_OWN_POST,
        Permissions.CREATE_COMMENT,
        Permissions.EDIT_OWN_COMMENT,
        Permissions.DELETE_OWN_COMMENT,
        Permissions.VOTE,
        Permissions.FAVORITE,
    ],
}


def get_user_role(user: User) -> str:
    """Get the role name for a user."""
    if user.role:
        return user.role.name
    return "user"


def has_permission(user: User, permission: str) -> bool:
    """Check if a user has a specific permission."""
    if not user or not user.is_active or user.is_banned:
        return False

    role_name = get_user_role(user)
    role_permissions = ROLE_PERMISSIONS.get(role_name, [])

    return permission in role_permissions


def has_any_permission(user: User, permissions: List[str]) -> bool:
    """Check if a user has any of the specified permissions."""
    return any(has_permission(user, p) for p in permissions)


def has_all_permissions(user: User, permissions: List[str]) -> bool:
    """Check if a user has all of the specified permissions."""
    return all(has_permission(user, p) for p in permissions)


def is_admin(user: User) -> bool:
    """Check if user is an admin."""
    return get_user_role(user) == "admin"


def is_moderator(user: User) -> bool:
    """Check if user is a moderator or admin."""
    return get_user_role(user) in ["admin", "moderator"]


def is_owner(user: User, resource_user_id: int) -> bool:
    """Check if user owns a resource."""
    return user.id == resource_user_id


def can_moderate_content(user: User, content_user_id: int) -> bool:
    """Check if user can moderate content (owner or moderator+)."""
    return is_owner(user, content_user_id) or is_moderator(user)


def check_resource_ownership(user: User, resource_user_id: int) -> bool:
    """Check if user owns the resource."""
    return user.id == resource_user_id


def require_permission(permission: str):
    """Decorator to require a specific permission."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if not has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission} required"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(permissions: List[str]):
    """Decorator to require any of the specified permissions."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if not has_any_permission(current_user, permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permission denied"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(roles: List[str]):
    """Decorator to require specific roles."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            user_role = get_user_role(current_user)
            if user_role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role {user_role} not authorized. Required: {', '.join(roles)}"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures user is an admin."""
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_moderator_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures user is a moderator or admin."""
    if not is_moderator(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator access required"
        )
    return current_user


def check_not_banned(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures user is not banned."""
    if current_user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned"
        )
    return current_user