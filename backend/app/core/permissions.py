from typing import List
from functools import wraps
from fastapi import HTTPException, status
from app.models.user import User
from app.utils.logger import app_logger


# Permission definitions
PERMISSIONS = {
    'user': [
        'post:create',
        'post:edit:own',
        'post:delete:own',
        'comment:create',
        'comment:edit:own',
        'comment:delete:own',
        'vote:create',
        'favorite:manage',
    ],
    'moderator': [
        'post:create',
        'post:edit:own',
        'post:delete:own',
        'comment:create',
        'comment:edit:own',
        'comment:delete:own',
        'comment:delete:any',
        'vote:create',
        'favorite:manage',
        'user:ban:comment',
        'thread:lock',
        'reports:view',
    ],
    'admin': [
        'post:create',
        'post:edit:own',
        'post:edit:any',
        'post:delete:own',
        'post:delete:any',
        'post:lock',
        'comment:create',
        'comment:edit:own',
        'comment:edit:any',
        'comment:delete:own',
        'comment:delete:any',
        'vote:create',
        'favorite:manage',
        'user:ban:platform',
        'user:ban:comment',
        'moderator:manage',
        'logs:view',
        'reports:view',
    ]
}


def get_user_permissions(user: User) -> List[str]:
    """
    Get all permissions for a user based on their role.
    
    Args:
        user: User model instance
    
    Returns:
        List of permission strings
    """
    if not user.role:
        return PERMISSIONS.get('user', [])
    
    role_name = user.role.name.lower()
    return PERMISSIONS.get(role_name, [])


def has_permission(user: User, permission: str) -> bool:
    """
    Check if user has specific permission.
    
    Args:
        user: User model instance
        permission: Permission string (e.g., 'post:delete:any')
    
    Returns:
        True if user has permission, False otherwise
    """
    if not user.is_active or user.is_banned:
        return False
    
    user_permissions = get_user_permissions(user)
    return permission in user_permissions


def require_permission(permission: str):
    """
    Decorator to require specific permission for endpoint.
    
    Usage:
        @router.delete("/posts/{post_id}")
        @require_permission("post:delete:any")
        async def delete_post(post_id: int, current_user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user from kwargs
            current_user = kwargs.get('current_user')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not has_permission(current_user, permission):
                app_logger.warning(
                    f"User {current_user.id} denied permission: {permission}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You don't have permission to perform this action"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def check_resource_ownership(user: User, resource_user_id: int) -> bool:
    """
    Check if user owns the resource or has admin privileges.
    
    Args:
        user: Current user
        resource_user_id: User ID of resource owner
    
    Returns:
        True if user owns resource or is admin
    """
    if user.id == resource_user_id:
        return True
    
    # Admins can access any resource
    return has_permission(user, 'post:edit:any')