from sqlalchemy.orm import Session
from app.models.access_log import AccessLog
from datetime import datetime

def log_access(db: Session, patient_id: int, doctor_id: int, action: str, record_id: int = None):
    """Add a new access log entry."""
    entry = AccessLog(
        patient_id=patient_id,
        doctor_id=doctor_id,
        record_id=record_id,
        action=action,
        timestamp=datetime.utcnow()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_patient_logs(db: Session, patient_id: int):
    """Fetch all access logs for a patient."""
    logs = db.query(AccessLog).filter(AccessLog.patient_id == patient_id).order_by(AccessLog.timestamp.desc()).all()
    return [
        {
            "doctor_id": log.doctor_id,
            "record_id": log.record_id,
            "action": log.action,
            "timestamp": log.timestamp
        }
        for log in logs
    ]
