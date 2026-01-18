from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, EmailStr
import secrets
from io import StringIO
import csv
from fastapi.responses import StreamingResponse

from app.database.connection import get_db
from app.models.user import User, RoleEnum
from app.models.record import Record
from app.models.access_log import AccessLog
from app.services.token_service import require_role
from app.services.auth_helpers import get_token_payload
from app.services.hash_service import hash_password
from app.services.crypto_service import (
    generate_ecc_keypair,
    encrypt_private_key_with_password
)

router = APIRouter(prefix="/hospital", tags=["Hospital"])

class CreateUser(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum  # doctor or patient
    description: str | None = None
    
@router.post("/users", dependencies=[Depends(require_role(RoleEnum.hospital))])
def create_user(
    data: CreateUser,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    hospital_id = payload["user_id"]

    if data.role == RoleEnum.hospital:
        raise HTTPException(400, "Cannot create hospital user")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(400, "Email already exists")

    temp_password = secrets.token_urlsafe(10)

    private_pem, public_pem = generate_ecc_keypair()
    enc = encrypt_private_key_with_password(private_pem, temp_password)

    user = User(
        name=data.name,
        email=data.email,
        role=data.role,
        hospital_id=hospital_id,
        password_hash=hash_password(temp_password),
        public_key=public_pem.decode(),

        private_key_encrypted=enc["ciphertext_b64"],
        private_key_salt=enc["salt_b64"],
        private_key_nonce=enc["nonce_b64"],
        private_key_iterations=enc["kdf_iterations"],

        doctor_description=data.description if data.role == RoleEnum.doctor else None,
        first_login=True,
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User created successfully",
        "user_id": user.id,
        "temporary_password": temp_password
    }

@router.get("/users", dependencies=[Depends(require_role(RoleEnum.hospital))])
def get_hospital_users(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    hospital_id = payload["user_id"]

    users = db.query(User).filter(
        User.hospital_id == hospital_id,
        User.role != RoleEnum.hospital
    ).all()

    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "first_login": u.first_login,
            "description": u.doctor_description
        }
        for u in users
    ]
    
@router.patch("/users/{user_id}/status",
              dependencies=[Depends(require_role(RoleEnum.hospital))])
def toggle_user_status(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    hospital_id = payload["user_id"]

    user = db.query(User).filter(
        User.id == user_id,
        User.hospital_id == hospital_id
    ).first()

    if not user:
        raise HTTPException(404, "User not found")

    user.is_active = is_active
    db.commit()

    return {"message": "User status updated"}


@router.get("/stats", dependencies=[Depends(require_role(RoleEnum.hospital))])
def get_hospital_stats(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    hospital_id = payload["user_id"]

    users_count = db.query(User).filter(
        User.hospital_id == hospital_id
    ).count()

    records_count = (
        db.query(Record)
        .join(User, Record.patient_id == User.id)
        .filter(User.hospital_id == hospital_id)
        .count()
    )

    emergency_count = db.query(AccessLog).filter(
        AccessLog.is_emergency == True
    ).count()

    return {
        "users": users_count,
        "records": records_count,
        "emergencies": emergency_count
    }

@router.get("/audit-logs", dependencies=[Depends(require_role(RoleEnum.hospital))])

def get_hospital_audit_logs(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    hospital_id = payload["user_id"]

    logs = (
        db.query(AccessLog)
        .join(User, AccessLog.patient_id == User.id)
        .filter(User.hospital_id == hospital_id)
        .order_by(desc(AccessLog.timestamp))
        .all()
    )

    result = []
    for log in logs:
        doctor = db.query(User).filter(User.id == log.doctor_id).first()
        patient = db.query(User).filter(User.id == log.patient_id).first()

        result.append({
            "id": log.id,
            "doctor": doctor.name if doctor else "Unknown",
            "patient": patient.name if patient else "Unknown",
            "record_id": log.record_id,
            "action": log.action,
            "is_emergency": log.is_emergency,
            "timestamp": log.timestamp.isoformat()
        })

    return {"logs": result}

@router.get("/audit-logs/download",
            dependencies=[Depends(require_role(RoleEnum.hospital))])
def download_audit_logs(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    hospital_id = payload["user_id"]

    logs = (
        db.query(AccessLog)
        .join(User, AccessLog.patient_id == User.id)
        .filter(User.hospital_id == hospital_id)
        .order_by(desc(AccessLog.timestamp))
        .all()
    )

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Log ID", "Doctor", "Patient", "Record ID",
        "Action", "Emergency", "Timestamp"
    ])

    for log in logs:
        doctor = db.query(User).filter(User.id == log.doctor_id).first()
        patient = db.query(User).filter(User.id == log.patient_id).first()

        writer.writerow([
            log.id,
            doctor.name if doctor else "Unknown",
            patient.name if patient else "Unknown",
            log.record_id or "-",
            log.action,
            log.is_emergency,
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hospital_audit_logs.csv"}
    )
