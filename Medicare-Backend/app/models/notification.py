from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from datetime import datetime
from app.database.connection import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    type = Column(String(50), nullable=False)  # EMERGENCY, APPROVAL, REQUEST, VIEW
    message = Column(Text, nullable=False)

    priority = Column(String(20), default="LOW")  # LOW, HIGH
    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)