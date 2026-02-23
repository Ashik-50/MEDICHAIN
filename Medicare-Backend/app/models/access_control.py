from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, String, Text
from datetime import datetime
from app.database.connection import Base

class AccessControl(Base):
    __tablename__ = "access_control"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    record_id = Column(Integer, ForeignKey("records.id"), nullable=True)

    encrypted_aes_key = Column(Text, nullable=True)
    nonce_b64 = Column(Text, nullable=True)
    eph_pub_b64 = Column(Text, nullable=True)

    granted = Column(Boolean, default=False)
    status = Column(String(100), default="pending")

    is_emergency = Column(Boolean, default=False)
    emergency_reason = Column(Text, nullable=True)

    expires_at = Column(DateTime, nullable=True)

    granted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)