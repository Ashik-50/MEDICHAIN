from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(200), nullable=False)
    ipfs_cid = Column(String(300), nullable=False)
    encryption_key = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    
    encrypted_key = Column(Text, nullable=True)   # base64 of AES key encrypted for patient
    signed_by_doctor = Column(String(200), nullable=True)  # doctor's email or id
    signature_b64 = Column(Text, nullable=True)  # base64 ECDSA signature (DER)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    description = Column(Text, nullable=True)
