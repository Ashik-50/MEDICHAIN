# app/services/ecc_utils.py
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.exceptions import InvalidSignature

# ----------------- key import/export helpers -----------------

def load_public_key_from_spki_b64(spki_b64: str):
    """Load a public key given base64-encoded SPKI DER bytes (string)."""
    der = base64.b64decode(spki_b64)
    return serialization.load_der_public_key(der)

def export_public_key_spki_b64(pubkey: ec.EllipticCurvePublicKey):
    der = pubkey.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return base64.b64encode(der).decode()

def load_private_key_from_pkcs8_b64(pkcs8_b64: str, password: bytes = None):
    der = base64.b64decode(pkcs8_b64)
    return serialization.load_der_private_key(der, password=password)

def export_private_key_pkcs8_b64(privkey: ec.EllipticCurvePrivateKey, password: bytes = None):
    if password:
        enc = serialization.BestAvailableEncryption(password)
    else:
        enc = serialization.NoEncryption()
    der = privkey.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=enc
    )
    return base64.b64encode(der).decode()

# ----------------- signature utils -----------------

def verify_ecdsa_signature(public_key_spki_b64: str, message: bytes, signature_b64: str) -> bool:
    """
    Verify ECDSA signature (DER-encoded) given public key (SPKI DER base64).
    Returns True/False.
    """
    try:
        pub = load_public_key_from_spki_b64(public_key_spki_b64)
        sig = base64.b64decode(signature_b64)
        pub.verify(sig, message, ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError, TypeError):
        return False

# ----------------- optional: server-side key generation (for testing) -----------------

def generate_ecc_keypair_b64():
    """
    Generate P-256 keypair and return tuple (private_pkcs8_b64, public_spki_b64).
    Only for development/testing; in production keys should be generated client-side.
    """
    priv = ec.generate_private_key(ec.SECP256R1())
    pub = priv.public_key()
    priv_b64 = export_private_key_pkcs8_b64(priv)
    pub_b64 = export_public_key_spki_b64(pub)
    return priv_b64, pub_b64
