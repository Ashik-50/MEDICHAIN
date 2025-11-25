from sqlalchemy import Column, Integer, ForeignKey, Enum, DateTime, String
from app.database.connection import Base
import enum
from datetime import datetime

class ConnectionStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ConnectionStatus))
    created_at = Column(DateTime, default=datetime.utcnow)
