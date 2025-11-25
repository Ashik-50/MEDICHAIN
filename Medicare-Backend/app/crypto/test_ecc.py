from ecc_encryption import *

# User A generates keypair
a_priv, a_pub = generate_keypair()

# User B generates keypair
b_priv, b_pub = generate_keypair()

# Exchange public keys
a_shared = derive_shared_key(a_priv, b_pub)
b_shared = derive_shared_key(b_priv, a_pub)

# Check both sides derive same key
assert a_shared == b_shared, "Shared keys do not match!"

# Encrypt a message
msg = "Secure transaction between A and B"
encrypted = encrypt_message(a_shared, msg)
print("Encrypted:", encrypted)

# Decrypt
decrypted = decrypt_message(b_shared, encrypted)
print("Decrypted:", decrypted)
