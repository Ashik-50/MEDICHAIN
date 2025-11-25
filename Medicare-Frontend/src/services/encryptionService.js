// src/services/encryptionService.js
import api from "./api";

export const encryptFileECC = async (file, publicKey) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("public_key", publicKey);

  const res = await api.post("/blockchain/encrypt-file", formData);
  return res.data;
};

export const decryptFileECC = async (ciphertext, nonce, privateKey, peerPublicKey) => {
  const formData = new FormData();
  formData.append("ciphertext", ciphertext);
  formData.append("nonce", nonce);
  formData.append("private_key", privateKey);
  formData.append("peer_public_key", peerPublicKey);

  const res = await api.post("/blockchain/decrypt-file", formData);
  return res.data;
};

export async function decryptPrivateKey(password, encryptedB64, saltB64, nonceB64, iterations = 390000) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const nonce = Uint8Array.from(atob(nonceB64), c => c.charCodeAt(0));
  const encryptedData = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    encryptedData
  );

  return dec.decode(decrypted);
}
