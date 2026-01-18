from app.database.connection import SessionLocal
from app.models.user import User, RoleEnum
from app.services.hash_service import hash_password

def create_hospital():
    db = SessionLocal()

    hospital_name = "KMCH Hospital"
    hospital_email = "admin@kmch.com"
    temp_password = "123"

    existing = db.query(User).filter(
        User.email == hospital_email,
        User.role == RoleEnum.hospital
    ).first()

    if existing:
        print("Hospital already exists")
        return

    hospital = User(
        name=hospital_name,
        email=hospital_email,
        role=RoleEnum.hospital,
        password_hash=hash_password(temp_password),
        first_login=True,
        is_active=True
    )

    db.add(hospital)
    db.commit()
    db.refresh(hospital)

    print("Hospital created successfully")
    print("Email:", hospital_email)
    print("Temporary Password:", temp_password)

    db.close()

if __name__ == "__main__":
    create_hospital()
