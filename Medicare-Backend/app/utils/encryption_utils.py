# app/utils/encryption_utils.py
from cryptography.fernet import Fernet
import base64

SECRET_KEY = Fernet.generate_key()
fernet = Fernet(SECRET_KEY)

def encrypt_data(data_bytes: bytes) -> str:
    """Encrypts raw bytes (like file data)."""
    return fernet.encrypt(data_bytes).decode()

def decrypt_data(token: str) -> bytes:
    """Decrypts and returns raw bytes."""
    return fernet.decrypt(token.encode())
