from app.database.connection import SessionLocal
from app.models.user import User, RoleEnum
from werkzeug.security import generate_password_hash

def seed_users():
    db = SessionLocal()

    # Avoid duplicates if already seeded
    if db.query(User).count() > 0:
        print("✅ Users already exist in the database.")
        db.close()
        return

    # ✅ 1. Create Admin (You)
    admin = User(
        name="Mohamed Ashik",
        email="ashik@gmail.com",
        password_hash=generate_password_hash("123"),
        role=RoleEnum.admin,
        public_key="ADMIN_PUBLIC_KEY_PLACEHOLDER",
        private_key="ADMIN_PRIVATE_KEY_PLACEHOLDER"
    )

    # ✅ 2. Create 10 Doctors
    doctors = [
        User(
            name=f"Doctor {i}",
            email=f"doctor{i}@gmail.com",
            password_hash=generate_password_hash("123"),
            role=RoleEnum.doctor,
            public_key=f"DOCTOR_{i}_PUB_KEY",
            private_key=f"DOCTOR_{i}_PRIV_KEY"
        )
        for i in range(1, 11)
    ]

    # ✅ 3. Create 10 Patients
    patients = [
        User(
            name=f"Patient {i}",
            email=f"patient{i}@medichain.com",
            password_hash=generate_password_hash("patient123"),
            role=RoleEnum.patient,
            public_key=f"PATIENT_{i}_PUB_KEY",
            private_key=f"PATIENT_{i}_PRIV_KEY"
        )
        for i in range(1, 11)
    ]

    # ✅ Add all users
    db.add(admin)
    db.add_all(doctors)
    db.add_all(patients)
    db.commit()
    db.close()

    print("🎉 Database seeded successfully with admin, doctors, and patients!")


if __name__ == "__main__":
    seed_users()
