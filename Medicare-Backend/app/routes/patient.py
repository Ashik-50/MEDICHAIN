from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.token_service import require_role
from app.database.connection import get_db
from app.models.user import User, RoleEnum

router = APIRouter(prefix="/patient", tags=["Patient"])

@router.get("/dashboard", dependencies=[Depends(require_role(RoleEnum.patient))])
def patient_dashboard():
    return {"message": "Patient Dashboard — Access Granted!"}


@router.get("/doctors")
def get_doctors(db: Session = Depends(get_db)):
    doctors = db.query(User).filter(User.role == RoleEnum.doctor).all()
    return {"doctors": [{"id": d.id, "name": d.name, "description": d.doctor_description} for d in doctors]}
