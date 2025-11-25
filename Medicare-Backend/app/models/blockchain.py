from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
import hashlib
from app.database.connection import Base

class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, nullable=False)
    patient_id = Column(Integer, nullable=False)
    record_id = Column(Integer, ForeignKey("records.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    hash_value = Column(String(255), nullable=False)
    previous_hash = Column(String(255), nullable=True)
    data_hash = Column(String(255), nullable=True)
    ipfs_cid = Column(String(255), nullable=True)

    @staticmethod
    def generate_hash(
        doctor_id: int,
        patient_id: int,
        ipfs_cid: str = "",
        previous_hash: str = "",
        data_hash: str = "",
    ) -> str:
        raw = f"{doctor_id}|{patient_id}|{ipfs_cid}|{previous_hash}|{data_hash}|{datetime.utcnow().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()
    