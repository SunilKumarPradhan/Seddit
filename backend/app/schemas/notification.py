from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class NotificationCreate(BaseModel):
    """Schema for creating notification."""
    user_id: int
    type: str
    message: str
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: int
    user_id: int
    type: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    """List of notifications."""
    notifications: list[NotificationResponse]
    unread_count: int