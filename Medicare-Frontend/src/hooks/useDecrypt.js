// src/hooks/useDecrypt.js
import { decryptFileECC } from "@/services/encryptionService";

export const useDecrypt = () => {
  const decryptFile = async (encryptedData, privateKey) => {
    const { ciphertext, nonce, peer_public_key } = encryptedData;

    if (!ciphertext || !nonce || !peer_public_key)
      throw new Error("Invalid encrypted data format");

    const result = await decryptFileECC(
      ciphertext,
      nonce,
      privateKey,
      peer_public_key
    );

    // The backend returns a base64 string of decrypted file
    const decryptedBase64 = result.decrypted_file_base64;
    const byteCharacters = atob(decryptedBase64);
    const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);

    // Return as a downloadable Blob
    return new Blob([byteArray]);
  };

  return { decryptFile };
};
