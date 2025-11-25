# app/routes/connections.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from app.database.connection import get_db
from app.models.connection import Connection, ConnectionStatus
from app.models.user import User, RoleEnum
from app.services.token_service import require_role
from app.services.auth_helpers import get_token_payload
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/connections", tags=["Connections"])

class ConnectionRequest(BaseModel):
    patient_id: int
    doctor_id: int

@router.post("/request")
def send_connection_request(req: ConnectionRequest, db: Session = Depends(get_db)):
    # 🧠 Validate patient & doctor
    patient = db.query(User).filter(User.id == req.patient_id).first()
    doctor = db.query(User).filter(User.id == req.doctor_id).first()

    if not patient or not doctor:
        raise HTTPException(status_code=404, detail="Doctor or patient not found")

    # 🔎 Check if already connected or pending
    existing = db.query(Connection).filter(
        Connection.patient_id == req.patient_id,
        Connection.doctor_id == req.doctor_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")

    # 🆕 Create new pending connection
    new_connection = Connection(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        status=ConnectionStatus.pending
    )
    db.add(new_connection)
    db.commit()
    db.refresh(new_connection)

    # 🩵 Return a detailed structured response
    return {
        "message": "Connection request sent successfully",
        "connection": {
            "connection_id": new_connection.id,
            "doctor_id": doctor.id,
            "doctor_name": doctor.name,
            "status": new_connection.status.value,
            "description": getattr(doctor, "description", "A dedicated healthcare professional focused on patient wellbeing."),
            "specialization": getattr(doctor, "specialization", "General Physician")
        }
    }


@router.get("/pending/{doctor_id}", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_pending_requests(
    doctor_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    # ✅ Verify doctor exists
    doctor = db.query(User).filter(User.id == doctor_id, User.role == RoleEnum.doctor).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # ✅ Fetch pending connections + join with patient user table
    pending_connections = (
        db.query(Connection, User)
        .join(User, User.id == Connection.patient_id)
        .filter(
            Connection.doctor_id == doctor_id,
            Connection.status == ConnectionStatus.pending
        )
        .all()
    )

    # ✅ Serialize data neatly for frontend
    result = []
    for conn, patient in pending_connections:
        result.append({
            "id": str(conn.id),
            "patient_id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "status": conn.status.value,
            "description": getattr(patient, "description", "Patient seeking medical consultation.")
        })

    return result


from app.models.access_control import AccessControl

@router.put("/respond", dependencies=[Depends(require_role(RoleEnum.doctor))])
def respond_to_request(connection_id: str, action: str, db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    doctor_email = payload.get("sub")
    doctor = db.query(User).filter(User.email == doctor_email).first()
    connection = db.query(Connection).filter(Connection.id == connection_id, Connection.doctor_id == doctor.id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found or not owned by doctor")
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    connection.status = ConnectionStatus.accepted if action == "accept" else ConnectionStatus.rejected
    db.add(connection)
    db.commit()
    db.refresh(connection)

    # 🧠 Automatically grant access if accepted
    if connection.status == ConnectionStatus.accepted:
        access = db.query(AccessControl).filter(
            AccessControl.patient_id == connection.patient_id,
            AccessControl.doctor_id == doctor.id
        ).first()
        if access:
            access.status = "approved"
            access.granted = True
            access.updated_at = datetime.utcnow()
        else:
            new_access = AccessControl(
                patient_id=connection.patient_id,
                doctor_id=doctor.id,
                status="approved",
                granted=True
            )
            db.add(new_access)
        db.commit()

    return {"message": f"Request {connection.status.value}", "status": connection.status.value}


@router.get("/active/{doctor_id}", dependencies=[Depends(require_role(RoleEnum.doctor))])
def get_active_connections(
    doctor_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    # ✅ Verify doctor exists
    doctor = db.query(User).filter(User.id == doctor_id, User.role == RoleEnum.doctor).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # ✅ Fetch all accepted connections + join with patient user table
    active_connections = (
        db.query(Connection, User)
        .join(User, User.id == Connection.patient_id)
        .filter(
            Connection.doctor_id == doctor_id,
            Connection.status == ConnectionStatus.accepted
        )
        .all()
    )

    # ✅ Structure clean response
    result = []
    for conn, patient in active_connections:
        result.append({
            "id": str(conn.id),
            "patient_id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "status": conn.status.value,
            "description": getattr(patient, "description", "Active patient under your care.")
        })

    return result


@router.get("/doctors")
def get_doctors_with_status(
    patient_id: int,
    db: Session = Depends(get_db)
):
    # 🧠 Validate patient existence
    patient = db.query(User).filter(User.id == patient_id, User.role == RoleEnum.patient).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 🧩 Fetch all doctors
    doctors = db.query(User).filter(User.role == RoleEnum.doctor).all()

    # 🧩 Fetch all connections by this patient
    connections = db.query(Connection).filter(Connection.patient_id == patient_id).all()
    connection_map = {c.doctor_id: c.status.value for c in connections}

    # 🧩 Build final list
    result = []
    for doc in doctors:
        result.append({
            "doctor_id": doc.id,
            "name": doc.name,
            "description": getattr(doc, "description", "A dedicated healthcare professional focused on patient wellbeing."),
            "specialization": getattr(doc, "specialization", "General Physician"),
            "status": connection_map.get(doc.id, "none")
        })

    return {"doctors": result} 


@router.post("/cancel", dependencies=[Depends(require_role(RoleEnum.patient))])
def cancel_request(patient_id: str, doctor_id: str, db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    patient = db.query(User).filter(User.id == patient_id, User.role == RoleEnum.patient).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    connection = db.query(Connection).filter(
        Connection.patient_id == patient_id,
        Connection.doctor_id == doctor_id,
        Connection.status == ConnectionStatus.pending
    ).first()
    if not connection:
        raise HTTPException(status_code=404, detail="No pending request found")
    db.delete(connection)
    db.commit()
    return {"message": "Request cancelled"}

@router.delete("/revoke", dependencies=[Depends(require_role(RoleEnum.doctor))])
def revoke_connection(
    patient_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    """
    Doctor revokes connection and access for a specific patient.
    Deletes both connection and access_control entries.
    """
    doctor_email = payload.get("sub")
    doctor = db.query(User).filter(User.email == doctor_email).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Find connection
    connection = db.query(Connection).filter(
        Connection.doctor_id == doctor.id,
        Connection.patient_id == patient_id
    ).first()

    # Find access control entry
    access = db.query(AccessControl).filter(
        AccessControl.doctor_id == doctor.id,
        AccessControl.patient_id == patient_id
    ).first()

    if not connection and not access:
        raise HTTPException(status_code=404, detail="No active connection or access record found")

    if connection:
        db.delete(connection)
    if access:
        db.delete(access)

    db.commit()

    return {"message": "Connection and access revoked successfully"}
