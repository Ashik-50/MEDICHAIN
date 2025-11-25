# app/services/encryption_service.py
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

# ---------------- AES helpers ----------------

def generate_aes_key_bytes(length: int = 16) -> bytes:
    """Return raw AES key bytes. Default 128-bit (16 bytes)."""
    return os.urandom(length)

def aes_encrypt_bytes(plaintext: bytes, key: bytes):
    """
    AES-GCM encrypt plaintext bytes.
    Returns tuple (ciphertext_b64, nonce_b64)
    """
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext, associated_data=None)
    return base64.b64encode(ct).decode(), base64.b64encode(nonce).decode()

def aes_decrypt_bytes_from_b64(ciphertext_b64: str, key_b64: str, nonce_b64: str) -> bytes:
    """
    Decrypt AES-GCM ciphertext (base64 inputs).
    Returns plaintext bytes.
    """
    key = base64.b64decode(key_b64)
    ct = base64.b64decode(ciphertext_b64)
    nonce = base64.b64decode(nonce_b64)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, associated_data=None)

# ---------------- ECDH + HKDF -> AES (ECIES-like) helpers ----------------

def derive_shared_key(private_key: ec.EllipticCurvePrivateKey, peer_public_key: ec.EllipticCurvePublicKey, length: int = 32) -> bytes:
    """
    Derive a symmetric key (bytes) by ECDH and HKDF(SHA256).
    """
    shared = private_key.exchange(ec.ECDH(), peer_public_key)
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=None,
        info=b"medichain-ecies",
    )
    return hkdf.derive(shared)

def encrypt_aes_key_for_recipient(aes_key_bytes: bytes, recipient_public_spki_b64: str):
    """
    Given raw AES key bytes and recipient public key (SPKI DER base64),
    produce an envelope with ephemeral public key and AES-GCM-encrypted AES key.
    Returns dict:
        {
          "ephemeral_public_spki_b64": "...",
          "encrypted_key_b64": "...",
          "nonce_b64": "..."
        }
    """
    # load recipient public key
    recipient_pub_der = base64.b64decode(recipient_public_spki_b64)
    recipient_pub = serialization.load_der_public_key(recipient_pub_der)

    # ephemeral key
    ephemeral_priv = ec.generate_private_key(ec.SECP256R1())
    ephemeral_pub = ephemeral_priv.public_key()

    # derive symmetric key
    sym_key = derive_shared_key(ephemeral_priv, recipient_pub, length=32)

    # encrypt AES key with sym_key using AES-GCM
    aesgcm = AESGCM(sym_key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, aes_key_bytes, None)

    ephemeral_pub_der = ephemeral_pub.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    return {
        "ephemeral_public_spki_b64": base64.b64encode(ephemeral_pub_der).decode(),
        "encrypted_key_b64": base64.b64encode(ct).decode(),
        "nonce_b64": base64.b64encode(nonce).decode()
    }

def decrypt_aes_key_from_sender(ephemeral_public_spki_b64: str, encrypted_key_b64: str, nonce_b64: str, recipient_private_pkcs8_b64: str) -> bytes:
    """
    Recipient provides their private key (PKCS8 DER base64) to decrypt the AES key envelope.
    Returns raw AES key bytes.
    """
    priv_der = base64.b64decode(recipient_private_pkcs8_b64)
    recipient_priv = serialization.load_der_private_key(priv_der, password=None)

    ephemeral_pub_der = base64.b64decode(ephemeral_public_spki_b64)
    ephemeral_pub = serialization.load_der_public_key(ephemeral_pub_der)

    sym_key = derive_shared_key(recipient_priv, ephemeral_pub, length=32)
    aesgcm = AESGCM(sym_key)
    ct = base64.b64decode(encrypted_key_b64)
    nonce = base64.b64decode(nonce_b64)
    aes_key_bytes = aesgcm.decrypt(nonce, ct, None)
    return aes_key_bytes

# ---------------- Utilities ----------------

def b64encode_bytes(b: bytes) -> str:
    return base64.b64encode(b).decode()

def b64decode_to_bytes(s: str) -> bytes:
    return base64.b64decode(s)
