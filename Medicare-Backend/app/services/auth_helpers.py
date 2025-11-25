from fastapi import Depends
from app.services.token_service import oauth2_scheme, decode_token
from app.models.user import User
import base64, os
from fastapi import HTTPException
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def get_token_payload(token: str = Depends(oauth2_scheme)):
    return decode_token(token)

def get_private_key_for_user(user: User, password: str) -> str:
    """
    Decrypts and returns the user's private key (PEM) using PBKDF2 + AES-GCM.
    """
    if not user.private_key_encrypted or not user.private_key_salt or not user.private_key_nonce:
        raise HTTPException(status_code=400, detail="Incomplete private key data")

    try:
        salt = base64.b64decode(user.private_key_salt)
        nonce = base64.b64decode(user.private_key_nonce)
        ciphertext = base64.b64decode(user.private_key_encrypted)

        # Derive AES key from user's password
        key = PBKDF2(password, salt, dkLen=32, count=100000, hmac_hash_module=SHA256)

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        decrypted = cipher.decrypt(ciphertext)

        return decrypted.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Private key decryption failed: {str(e)}")
    
def decrypt_stored_password(encrypted_password_b64: str) -> str:
    """
    Decrypts a user’s stored encrypted password using backend secret.
    The password was encrypted using AES-GCM with a static backend secret.
    """
    try:
        backend_secret = os.getenv("PASSWORD_ENCRYPTION_KEY", "default_backend_secret")
        if not encrypted_password_b64:
            raise ValueError("Empty encrypted password")

        # Decode the Base64 stored format
        data = base64.b64decode(encrypted_password_b64)

        # Extract nonce (12 bytes) and ciphertext
        nonce, ciphertext = data[:12], data[12:]

        # Derive 256-bit key from backend secret
        key = PBKDF2(backend_secret, b"password_salt", dkLen=32, count=100000, hmac_hash_module=SHA256)

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        decrypted_bytes = cipher.decrypt(ciphertext)

        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        raise Exception(f"Failed to decrypt stored password: {str(e)}")
    
    
KDF_ITERATIONS = 390000

def get_private_key_via_master_key(user) -> str:
    """
    Decrypts a user's private key using the backend master key.
    Used when doctor decrypts a patient record automatically.
    """
    try:
        backend_secret = os.getenv("PASSWORD_ENCRYPTION_KEY", "medi-chain-master-key").encode()
        master_salt = base64.b64decode(user.private_key_backup_salt)
        master_nonce = base64.b64decode(user.private_key_backup_nonce)
        master_ct = base64.b64decode(user.private_key_backup_encrypted)

        master_key = PBKDF2(
            backend_secret, master_salt, dkLen=32, count=KDF_ITERATIONS, hmac_hash_module=SHA256
        )
        aesgcm = AESGCM(master_key)
        decrypted = aesgcm.decrypt(master_nonce, master_ct, None)

        return decrypted.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Master key decryption failed: {str(e)}")