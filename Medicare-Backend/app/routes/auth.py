# app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User, RoleEnum
from app.services.hash_service import hash_password, verify_password
from app.services.token_service import create_access_token, decode_token
from pydantic import BaseModel, EmailStr
from app.services.auth_helpers import get_token_payload
from app.services.token_service import require_role
from datetime import timedelta
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from app.services.crypto_service import ( generate_ecc_keypair, encrypt_private_key_with_password, KDF_ITERATIONS, master_wrap_private_pem)

router = APIRouter(prefix="/auth", tags=["Auth"])

class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum


class LoginUser(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    private_pem, public_pem = generate_ecc_keypair()

    # password-based wrap (already used by your login)
    enc = encrypt_private_key_with_password(private_pem, user.password)

    # master wrap (NEW) — allows backend fallback
    try:
        m = master_wrap_private_pem(private_pem)  # uses env MASTER_KEY_B64
    except Exception as e:
        # If master not configured, still allow registration but without fallback:
        m = {"ciphertext_b64": None, "salt_b64": None, "nonce_b64": None, "kdf_iterations": None}

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=RoleEnum(user.role.value),
        public_key=public_pem.decode(),

        private_key_encrypted=enc["ciphertext_b64"],
        private_key_salt=enc["salt_b64"],
        private_key_nonce=enc["nonce_b64"],
        private_key_iterations=enc["kdf_iterations"],

        private_key_master_encrypted=m["ciphertext_b64"],
        private_key_master_salt=m["salt_b64"],
        private_key_master_nonce=m["nonce_b64"],
        private_key_master_iterations=m["kdf_iterations"],
    )

    db.add(new_user)
    db.flush()
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "user": new_user.email, "id": new_user.id}

@router.post("/login")
def login(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.email, "role": db_user.role.value, "user_id": db_user.id})

    return {
        "id": db_user.id,
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role.value,
        "private_key_encrypted": db_user.private_key_encrypted,
        "private_key_salt": db_user.private_key_salt,
        "private_key_nonce": db_user.private_key_nonce,
        "kdf_iterations": getattr(db_user, "private_key_iterations", KDF_ITERATIONS),
    }

@router.post("/refresh")
def refresh_token(refresh_token: str):
    try:
        payload = decode_token(refresh_token, refresh=True)
        user_data = {"sub": payload.get("sub"), "role": payload.get("role")}
        new_access_token = create_access_token(user_data, timedelta(minutes=60))
        return {"access_token": new_access_token, "token_type": "bearer"}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/upload-keys", dependencies=[Depends(get_token_payload)])
def upload_keys(
    public_key_spki_b64: str = Body(..., embed=True),
    private_key_pkcs8_b64: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_token_payload)
):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.public_key = public_key_spki_b64
    user.private_key = private_key_pkcs8_b64
    db.commit()

    return {"message": "Public & Private keys stored successfully"}

@router.get("/get-keys", dependencies=[Depends(get_token_payload)])
def get_user_keys(db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.public_key or not user.private_key_encrypted:
        raise HTTPException(status_code=404, detail="Keys not found for this user")

    return {
        "public_key": user.public_key,
        "private_key_encrypted": user.private_key_encrypted,
        "salt": user.private_key_salt,
        "nonce": user.private_key_nonce,
        "kdf_iterations": getattr(user, "private_key_iterations", 390000),
    }

@router.get("/me", dependencies=[Depends(get_token_payload)])
def get_current_user(db: Session = Depends(get_db), payload: dict = Depends(get_token_payload)):
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value
    }
    
@router.get("/public-key/{user_id}")
def get_public_key(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.public_key:
        raise HTTPException(status_code=404, detail="Public key not found")
    return {"public_key": user.public_key}