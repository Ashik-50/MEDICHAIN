import base64
import os
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Generate ECC key pair (P-256)
def generate_keypair():
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    return private_key, public_key

# Serialize public key to string
def serialize_public_key(public_key):
    return base64.b64encode(
        public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
    ).decode()

# Deserialize public key from string
def deserialize_public_key(public_key_str):
    return ec.EllipticCurvePublicKey.from_encoded_point(
        ec.SECP256R1(),
        base64.b64decode(public_key_str)
    )

# Derive shared key using ECDH
def derive_shared_key(private_key, peer_public_key):
    shared_secret = private_key.exchange(ec.ECDH(), peer_public_key)
    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b'ecdh-encryption'
    ).derive(shared_secret)
    return derived_key

# Encrypt message using AES-GCM
def encrypt_message(shared_key, plaintext):
    aesgcm = AESGCM(shared_key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(ciphertext).decode(), base64.b64encode(nonce).decode()

# Decrypt message using AES-GCM
def decrypt_message(shared_key, ciphertext_b64, nonce_b64):
    aesgcm = AESGCM(shared_key)
    ciphertext = base64.b64decode(ciphertext_b64)
    nonce = base64.b64decode(nonce_b64)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode()
