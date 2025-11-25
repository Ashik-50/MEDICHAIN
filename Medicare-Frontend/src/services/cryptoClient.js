// src/services/cryptoClient.js
// utilities: base64 <-> ArrayBuffer

export function b64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
export function arrayBufferToString(buf) {
  return new TextDecoder().decode(new Uint8Array(buf));
}

export async function deriveKeyFromPassword(password, saltB64, iterations = 390000) {
  const salt = b64ToArrayBuffer(saltB64);
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

export async function decryptPrivateKey(ciphertextB64, nonceB64, password, saltB64, iterations = 390000) {
  const key = await deriveKeyFromPassword(password, saltB64, iterations);
  const ct = b64ToArrayBuffer(ciphertextB64);
  const nonce = b64ToArrayBuffer(nonceB64);
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(nonce) }, key, ct);
  // decrypted is ArrayBuffer with private PEM bytes
  return arrayBufferToString(decrypted); // returns PEM string
}
