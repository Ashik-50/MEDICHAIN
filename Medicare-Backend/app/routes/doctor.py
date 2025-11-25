# app/routes/doctor.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User, RoleEnum
from app.models.record import Record
from app.services.token_service import require_role
from app.services.auth_helpers import get_token_payload
from datetime import datetime
import os, shutil, secrets, base64
from app.models.access_control import AccessControl

router = APIRouter(prefix="/doctor", tags=["Doctor"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/dashboard", dependencies=[Depends(require_role(RoleEnum.doctor))])
def doctor_dashboard():
    return {"message": "Doctor dashboard is active!"}


@router.get("/patients", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_patients(db: Session = Depends(get_db)):
    patients = db.query(User).filter(User.role == RoleEnum.patient).all()
    return {"patients": [{"id": p.id, "name": p.name, "email": p.email} for p in patients]}


@router.post("/upload_record", dependencies=[Depends(require_role(RoleEnum.doctor))])
async def upload_record(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    doctor_email = payload.get("sub")
    doctor = db.query(User).filter(User.email == doctor_email).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    patient = db.query(User).filter(User.id == patient_id, User.role == RoleEnum.patient).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Do NOT store raw encryption_key. Instead mark as server-encrypted or require explicit envelope
    new_record = Record(
        patient_id=patient.id,
        doctor_id=doctor.id,
        filename=file.filename,
        file_path=file_path,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return {"message": "Record uploaded successfully", "record_id": new_record.id}


@router.get("/records", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_uploaded_records(db: Session = Depends(get_db)):
    records = db.query(Record).all()
    return {
        "records": [
            {
                "id": r.id,
                "patient_id": r.patient_id,
                "filename": r.filename,
                "uploaded_at": r.uploaded_at
            } for r in records
        ]
    }


@router.get("/patient/{patient_id}", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_records_by_patient(patient_id: int, db: Session = Depends(get_db)):
    records = db.query(Record).filter(Record.patient_id == patient_id).all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "uploaded_at": r.uploaded_at.isoformat(),
            "doctor_id": r.doctor_id,
            "encrypted_key": r.encrypted_key,
        }
        for r in records
    ]

@router.get("/granted-patients", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_granted_patients(db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    doctor_id = int(payload.get("user_id") or payload.get("sub"))

    granted_entries = db.query(AccessControl).filter(
        AccessControl.doctor_id == doctor_id,
        AccessControl.granted == True
    ).all()

    patient_ids = [entry.patient_id for entry in granted_entries]
    if not patient_ids:
        return {"patients": []}

    patients = db.query(User).filter(User.id.in_(patient_ids)).all()
    return {
        "patients": [
            {"id": p.id, "name": p.name, "email": p.email}
            for p in patients
        ]
    }

@router.get("/my-records", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_my_uploaded_records(db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    doctor_id = int(payload.get("user_id") or payload.get("sub"))
    records = db.query(Record).filter(Record.doctor_id == doctor_id).all()
    return {
        "records": [
            {
                "id": r.id,
                "patient_id": r.patient_id,
                "filename": r.filename,
                "description": r.description,
                "uploaded_at": r.uploaded_at
            }
            for r in records
        ]
    }

@router.get("/accessible-patients", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_accessible_patients(db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    doctor_id = int(payload.get("user_id") or payload.get("sub"))
    access_list = db.query(AccessControl).filter(
        AccessControl.doctor_id == doctor_id,
        AccessControl.granted == True
    ).all()

    patient_ids = [a.patient_id for a in access_list]
    patients = db.query(User).filter(User.id.in_(patient_ids)).all()

    return [{"id": p.id, "name": p.name, "email": p.email} for p in patients]
