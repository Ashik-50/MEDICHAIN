# app/services/crypto_service.py
import os
import base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import ec

KDF_ITERATIONS = 390000
SALT_LEN = 16
NONCE_LEN = 12 
AES_KEY_LEN = 32 

def generate_ecc_keypair():
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


def _derive_aes_key(password: str, salt: bytes, iterations: int = KDF_ITERATIONS) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=AES_KEY_LEN,
        salt=salt,
        iterations=iterations,
    )
    return kdf.derive(password.encode())


def encrypt_private_key_with_password(private_pem: bytes, password: str):
    """
    Encrypts ECC private key twice:
      User encryption with password (as before)
      Backend backup encryption with master key
    """
    from Crypto.Protocol.KDF import PBKDF2
    from Crypto.Hash import SHA256

    # === (1) User-based encryption (password-derived) ===
    salt = os.urandom(SALT_LEN)
    key = _derive_aes_key(password, salt)
    aesgcm = AESGCM(key)
    nonce = os.urandom(NONCE_LEN)
    ct = aesgcm.encrypt(nonce, private_pem, None)

    # === (2) Backend master-key encryption (for system fallback) ===
    backend_secret = os.getenv("PASSWORD_ENCRYPTION_KEY", "medi-chain-master-key").encode()
    master_salt = os.urandom(SALT_LEN)
    master_nonce = os.urandom(NONCE_LEN)

    master_key = PBKDF2(
        backend_secret, master_salt, dkLen=AES_KEY_LEN, count=KDF_ITERATIONS, hmac_hash_module=SHA256
    )
    master_cipher = AESGCM(master_key)
    master_ct = master_cipher.encrypt(master_nonce, private_pem, None)

    return {
        # User-protected layer
        "ciphertext_b64": base64.b64encode(ct).decode(),
        "salt_b64": base64.b64encode(salt).decode(),
        "nonce_b64": base64.b64encode(nonce).decode(),

        # Master-key backup layer
        "backup_ciphertext_b64": base64.b64encode(master_ct).decode(),
        "backup_salt_b64": base64.b64encode(master_salt).decode(),
        "backup_nonce_b64": base64.b64encode(master_nonce).decode(),

        "kdf_iterations": KDF_ITERATIONS,
    }


def decrypt_private_key_with_password(ciphertext_b64: str, salt_b64: str, nonce_b64: str, password: str, iterations: int):
    """
    For backend tests only (we will not use this in production backend).
    Returns private_pem bytes if password correct else raises exception.
    """
    ct = base64.b64decode(ciphertext_b64)
    salt = base64.b64decode(salt_b64)
    nonce = base64.b64decode(nonce_b64)
    key = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=AES_KEY_LEN,
        salt=salt,
        iterations=iterations,
    ).derive(password.encode())
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, None)

def generate_aes_key() -> bytes:
    return os.urandom(AES_KEY_LEN)

def aes_gcm_encrypt(plaintext: bytes, key: bytes) -> dict:
    nonce = os.urandom(NONCE_LEN)
    ct = AESGCM(key).encrypt(nonce, plaintext, None)
    return {
        "ciphertext_b64": base64.b64encode(ct).decode(),
        "nonce_b64": base64.b64encode(nonce).decode(),
    }

def _load_public_key_from_pem(pem_str: str):
    return serialization.load_pem_public_key(pem_str.encode())

def ecc_box_encrypt_for_recipient(recipient_public_pem: str, plaintext: bytes) -> dict:
    """
    ECIES-like: ephemeral ECDH -> HKDF -> AES-GCM
    Returns ciphertext + nonce + ephemeral public key (SPKI) all base64.
    """
    recipient_pub = _load_public_key_from_pem(recipient_public_pem)

    eph_priv = ec.generate_private_key(ec.SECP256R1())
    shared = eph_priv.exchange(ec.ECDH(), recipient_pub)

    kek = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"medichain-keywrap").derive(shared)

    box = aes_gcm_encrypt(plaintext, kek)

    eph_pub_spki = eph_priv.public_key().public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    return {
        "wrapped_b64": box["ciphertext_b64"],
        "nonce_b64": box["nonce_b64"],
        "eph_pub_spki_b64": base64.b64encode(eph_pub_spki).decode(),
    }
    
def _kdf_bytes(secret: bytes, salt: bytes, iterations: int) -> bytes:
    return PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=AES_KEY_LEN,
        salt=salt,
        iterations=iterations,
    ).derive(secret)

def get_master_secret_bytes() -> bytes:
    """
    Reads MASTER_KEY_B64 (32 bytes base64) from env. Fails loudly if missing/invalid.
    Example: MASTER_KEY_B64=aiW8c0w7... (base64 of 32 random bytes)
    """
    b64 = os.getenv("MASTER_KEY_B64", "")
    if not b64:
        raise RuntimeError("MASTER_KEY_B64 not set")
    try:
        raw = base64.b64decode(b64)
    except Exception:
        raise RuntimeError("MASTER_KEY_B64 must be valid base64")
    if len(raw) != 32:
        raise RuntimeError("MASTER_KEY_B64 must decode to 32 bytes")
    return raw

def master_wrap_private_pem(private_pem: bytes, iterations: int = KDF_ITERATIONS) -> dict:
    """
    Encrypt a private key with a server-side master secret (not the user's password).
    Stores salt+nonce+iterations to allow rotation later.
    """
    master = get_master_secret_bytes()
    salt = os.urandom(SALT_LEN)
    key = _kdf_bytes(master, salt, iterations)
    aes = AESGCM(key)
    nonce = os.urandom(NONCE_LEN)
    ct = aes.encrypt(nonce, private_pem, None)
    return {
        "ciphertext_b64": base64.b64encode(ct).decode(),
        "salt_b64": base64.b64encode(salt).decode(),
        "nonce_b64": base64.b64encode(nonce).decode(),
        "kdf_iterations": iterations,
    }

def master_unwrap_private_pem(ciphertext_b64: str, salt_b64: str, nonce_b64: str, iterations: int) -> bytes:
    master = get_master_secret_bytes()
    ct = base64.b64decode(ciphertext_b64)
    salt = base64.b64decode(salt_b64)
    nonce = base64.b64decode(nonce_b64)
    key = _kdf_bytes(master, salt, iterations)
    aes = AESGCM(key)
    return aes.decrypt(nonce, ct, None)