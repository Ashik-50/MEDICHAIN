from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User, RoleEnum
from app.models.blockchain import Block
from app.models.access_log import AccessLog
from app.models.record import Record
from app.services.token_service import require_role
from sqlalchemy import desc
from io import StringIO
import csv
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

# Admin-only dashboard stats
@router.get("/stats", dependencies=[Depends(require_role(RoleEnum.admin))])
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_blocks = db.query(Block).count()
    total_records = db.query(Record).count()
    total_logs = db.query(AccessLog).count()
    return {
        "users": total_users,
        "blocks": total_blocks,
        "records": total_records,
        "logs": total_logs,
    }

# Get all users (doctors + patients)
@router.get("/users", dependencies=[Depends(require_role(RoleEnum.admin))])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
        }
        for u in users
    ]
    return {"users": result}

@router.get("/users", dependencies=[Depends(require_role(RoleEnum.admin))])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.value,
            }
            for u in users
        ]
    }

@router.delete("/delete-user/{user_id}", dependencies=[Depends(require_role(RoleEnum.admin))])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.put("/update-doctor-description", dependencies=[Depends(require_role(RoleEnum.admin))])
def update_doctor_description(data: dict = Body(...), db: Session = Depends(get_db)):
    email = data.get("email")
    description = data.get("description", "")

    doctor = db.query(User).filter(User.email == email, User.role == RoleEnum.doctor).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.description = description
    db.commit()
    return {"message": "Doctor description updated successfully"}

# ✅ Fetch all logs (for UI)
@router.get("/audit-logs", dependencies=[Depends(require_role(RoleEnum.admin))])
def get_audit_logs(db: Session = Depends(get_db)):
    """
    Returns all access logs with doctor and patient names for the admin audit panel.
    """
    logs = db.query(AccessLog).order_by(desc(AccessLog.timestamp)).all()

    result = []
    for log in logs:
        doctor = db.query(User).filter(User.id == log.doctor_id).first()
        patient = db.query(User).filter(User.id == log.patient_id).first()

        result.append({
            "id": log.id,
            "doctor_id": log.doctor_id,
            "doctor_name": doctor.name if doctor else "Unknown Doctor",
            "patient_id": log.patient_id,
            "patient_name": patient.name if patient else "Unknown Patient",
            "record_id": log.record_id,
            "action": log.action,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        })

    return {"logs": result}


# ✅ Download logs as CSV
@router.get("/audit-logs/download", dependencies=[Depends(require_role(RoleEnum.admin))])
def download_audit_logs(db: Session = Depends(get_db)):
    """
    Allows admin to download all audit logs as CSV.
    """
    logs = db.query(AccessLog).order_by(desc(AccessLog.timestamp)).all()

    # Prepare CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Doctor", "Patient", "Record ID", "Action", "Timestamp"])

    for log in logs:
        doctor = db.query(User).filter(User.id == log.doctor_id).first()
        patient = db.query(User).filter(User.id == log.patient_id).first()
        writer.writerow([
            log.id,
            doctor.name if doctor else "Unknown Doctor",
            patient.name if patient else "Unknown Patient",
            log.record_id or "-",
            log.action,
            log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "-"
        ])

    output.seek(0)
    headers = {
        "Content-Disposition": "attachment; filename=audit_logs.csv"
    }

    return StreamingResponse(output, media_type="text/csv", headers=headers)
