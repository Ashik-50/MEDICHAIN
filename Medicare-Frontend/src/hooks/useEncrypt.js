// src/hooks/useEncrypt.js
import { encryptFileECC } from "@/services/encryptionService";

export const useEncrypt = () => {
  const encryptFile = async (file) => {
    const doctorPublicKey = localStorage.getItem("doctor_public_key");
    if (!doctorPublicKey) throw new Error("Doctor public key not found");

    // Send the actual file + public key to backend
    const result = await encryptFileECC(file, doctorPublicKey);

    return result;
  };

  return { encryptFile };
};
