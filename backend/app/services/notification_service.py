from typing import List
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationListResponse
from app.core.redis_client import redis_client
from app.utils.logger import app_logger
import json


class NotificationService:
    """Service for notification operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(self, notification_data: NotificationCreate) -> Notification:
        """Create a new notification."""
        notification = Notification(
            user_id=notification_data.user_id,
            type=notification_data.type,
            message=notification_data.message,
            link=notification_data.link
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        app_logger.info(f"Notification created for user {notification.user_id}")
        
        # Publish to Redis Stream for real-time delivery
        self._publish_to_stream(notification)
        
        return notification
    
    def get_user_notifications(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False
    ) -> NotificationListResponse:
        """Get notifications for a user."""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        
        unread_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
        
        notification_responses = [
            NotificationResponse(
                id=n.id,
                user_id=n.user_id,
                type=n.type,
                message=n.message,
                link=n.link,
                is_read=n.is_read,
                created_at=n.created_at
            ) for n in notifications
        ]
        
        return NotificationListResponse(
            notifications=notification_responses,
            unread_count=unread_count
        )
    
    def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            self.db.commit()
            app_logger.info(f"Notification {notification_id} marked as read")
            return True
        
        return False
    
    def mark_all_as_read(self, user_id: int) -> int:
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        
        self.db.commit()
        app_logger.info(f"Marked {count} notifications as read for user {user_id}")
        return count
    
    def _publish_to_stream(self, notification: Notification):
        try:
            notification_data = {
                "id": str(notification.id),
                "user_id": str(notification.user_id),
                "type": notification.type,
                "message": notification.message,
                "link": notification.link or "",
                "created_at": notification.created_at.isoformat()
            }
            
            redis_client.add_to_stream("notifications:stream", notification_data)
            app_logger.debug(f"Notification published to stream: {notification.id}")
        except Exception as e:
            app_logger.error(f"Failed to publish notification to stream: {e}")