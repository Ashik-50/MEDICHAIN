from app.models.notification import Notification
from sqlalchemy.orm import Session

def create_notification(db: Session, user_id: int, type: str, message: str, priority: str = "LOW"):
    notification = Notification(
        user_id=user_id,
        type=type,
        message=message,
        priority=priority
    )
    db.add(notification)
    db.commit()