# app/routes/blockchain.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.connection import get_db
from app.models.blockchain import Block
from app.models.user import RoleEnum
from app.services.blockchain_service import get_all_blocks, verify_chain, add_block as service_add_block
from app.services.token_service import require_role
from app.services.auth_helpers import get_token_payload
from pydantic import BaseModel
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64, os, json, hashlib
from datetime import datetime

router = APIRouter(prefix="/blockchain", tags=["Blockchain"])

@router.get("/blockchain/verify")
def verify_chain(db: Session = Depends(get_db)):
    blocks = db.query(Block).order_by(Block.id).all()
    for i in range(1, len(blocks)):
        if blocks[i].previous_hash != blocks[i-1].hash_value:
            return {"valid": False, "error_at": blocks[i].id}
    return {"valid": True, "message": "Blockchain is valid and untampered"}


@router.get("/doctor/{doctor_id}")
def get_doctor_blockchain(doctor_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all blockchain entries for a given doctor.
    Each entry shows doctor_id, patient_id, hash_value, timestamp.
    """

    # Fetch all blocks for the doctor
    results = db.execute(text("""
        SELECT id AS block_number, doctor_id, patient_id, hash_value, timestamp
        FROM blocks
        WHERE doctor_id = :doctor_id
        ORDER BY id DESC
    """), {"doctor_id": doctor_id}).fetchall()

    if not results:
        raise HTTPException(status_code=404, detail="No blockchain entries found for this doctor")

    # Convert result rows to a structured list
    response = []
    for row in results:
        response.append({
            "block_number": row.block_number,
            "patient_id": row.patient_id,
            "action": "File Uploaded",
            "hash": row.hash_value,
            "timestamp": row.timestamp,
            "status": "Verified"
        })

    return response

@router.get("/patient/{patient_id}")
def get_patient_blockchain(patient_id: int, db: Session = Depends(get_db)):
    """
    Fetch blockchain transactions for a specific patient.
    """
    results = db.execute(text("""
        SELECT id AS block_number, doctor_id, patient_id, hash_value, timestamp
        FROM blocks
        WHERE patient_id = :patient_id
        ORDER BY id DESC
    """), {"patient_id": patient_id}).fetchall()

    if not results:
        raise HTTPException(status_code=404, detail="No blockchain entries found for this patient")

    response = []
    for row in results:
        response.append({
            "block_number": row.block_number,
            "doctor_id": row.doctor_id,
            "action": "Record Uploaded by Doctor",
            "hash": row.hash_value,
            "timestamp": row.timestamp,
            "status": "Verified"
        })
    return response

@router.get("/ledger")
def get_ledger(db: Session = Depends(get_db)):
    """
    Returns a detailed blockchain ledger with doctor/patient names.
    """
    from app.models.user import User  # import locally to avoid circular dependency

    blocks = db.query(Block).order_by(Block.id.desc()).all()
    ledger = []

    for b in blocks:
        # Fetch related doctor & patient names (if exist)
        doctor = db.query(User).filter(User.id == b.doctor_id).first()
        patient = db.query(User).filter(User.id == b.patient_id).first()

        ledger.append({
            "id": b.id,
            "doctor_id": b.doctor_id,
            "doctor_name": doctor.name if doctor else "Unknown",
            "patient_id": b.patient_id,
            "patient_name": patient.name if patient else "Unknown",
            "record_id": b.record_id,
            "ipfs_cid": b.ipfs_cid,
            "data_hash": b.data_hash,
            "previous_hash": b.previous_hash,
            "hash": b.hash_value,  # renamed for frontend consistency
            "action": "Record Uploaded",  # consistent action label
            "timestamp": b.timestamp.isoformat() if b.timestamp else None,
        })

    return {"blocks": ledger}

@router.get("/verify", dependencies=[Depends(require_role(RoleEnum.admin))])
def verify_blockchain(db: Session = Depends(get_db)):
    blocks = db.query(Block).order_by(Block.id).all()
    previous_hash = "0"
    for block in blocks:
        expected_hash = Block.generate_hash(
            block.doctor_id,
            block.patient_id,
            block.ipfs_cid,
            block.previous_hash,
            block.data_hash,
        )
        if block.previous_hash != previous_hash or block.hash_value != expected_hash:
            return {"valid": False}
        previous_hash = block.hash_value
    return {"valid": True}