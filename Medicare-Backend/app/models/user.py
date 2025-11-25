from sqlalchemy import Column, Integer, String, Enum, Text
from app.database.connection import Base
import enum

class RoleEnum(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)

    public_key = Column(Text, nullable=True)
    doctor_description = Column(Text, nullable=True)
    private_key_encrypted = Column(Text, nullable=True)
    private_key_salt = Column(Text, nullable=True)
    private_key_nonce = Column(Text, nullable=True)

    private_key_backup_encrypted = Column(Text, nullable=True)
    private_key_backup_salt = Column(Text, nullable=True)
    private_key_backup_nonce = Column(Text, nullable=True)
    private_key_iterations = Column(Integer, nullable=True)   

    # master-key wrap (NEW)
    private_key_master_encrypted = Column(Text, nullable=True)
    private_key_master_salt = Column(Text, nullable=True)
    private_key_master_nonce = Column(Text, nullable=True)
    private_key_master_iterations = Column(Integer, nullable=True)