import React, { useState, useEffect, useRef } from "react";
import DoctorLayout from "../../components/DoctorLayout";
import { motion } from "framer-motion";
import { Loader2, Upload, ShieldCheck, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { getAccessiblePatients } from "../../services/doctorService";
import api from "../../services/api";
import PrimaryButton from "@/components/ui/PrimaryButton";

const generateAESKey = async () => {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

function uint8ToBase64(u8arr) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < u8arr.length; i += chunkSize) {
    const chunk = u8arr.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

const aesGcmEncrypt = async (fileBuffer, aesKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer
  );
  const ciphertext = new Uint8Array(cipherBuffer);
  return {
    ciphertextB64: uint8ToBase64(ciphertext),
    nonceB64: uint8ToBase64(iv),
  };
};

const eccWrapAESKey = async (recipientPublicKeyPem, aesKey) => {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const b64 = recipientPublicKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\n/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const recipientKey = await crypto.subtle.importKey(
    "spki",
    der.buffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const ephKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientKey },
    ephKeyPair.privateKey,
    256
  );

  const kek = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", sharedSecret),
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: wrapIv },
    kek,
    rawAesKey
  );

  const ephPubSpki = await crypto.subtle.exportKey("spki", ephKeyPair.publicKey);

  return {
    wrappedB64: btoa(String.fromCharCode(...new Uint8Array(wrapped))),
    nonceB64: btoa(String.fromCharCode(...wrapIv)),
    ephPubSpkiB64: btoa(String.fromCharCode(...new Uint8Array(ephPubSpki))),
  };
};

const DoctorUploadPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchAccessiblePatients = async () => {
      try {
        const res = await getAccessiblePatients();
        setPatients(res.data || []);
      } catch (err) {
        console.error("Error fetching accessible patients:", err);
      }
    };
    fetchAccessiblePatients();
  }, []);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please select a file first!");
    if (!selectedPatient) return toast.error("Please select a patient!");

    try {
      setLoading(true);
      const keyRes = await api.get(`/auth/public-key/${selectedPatient}`);
      const { public_key } = keyRes.data;

      const fileBuffer = await selectedFile.arrayBuffer();
      const aesKey = await generateAESKey();
      const encryptedFile = await aesGcmEncrypt(fileBuffer, aesKey);
      const wrapped = await eccWrapAESKey(public_key, aesKey);

      const rawKey = await crypto.subtle.exportKey("raw", aesKey);
      const rawKeyB64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

      const formData = new FormData();
      formData.append(
        "file",
        new File(
          [Uint8Array.from(atob(encryptedFile.ciphertextB64), (c) => c.charCodeAt(0))],
          selectedFile.name,
          { type: selectedFile.type }
        )
      );
      formData.append("description", notes);
      formData.append("patient_id", selectedPatient);
      formData.append("file_nonce_b64", encryptedFile.nonceB64);
      formData.append("wrapped_key", JSON.stringify(wrapped));
      formData.append("raw_aes_key_b64", rawKeyB64);

      const res = await api.post("/record/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`✅ Uploaded Successfully! CID: ${res.data.ipfs_cid}`);
      setSelectedFile(null);
      setNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(err?.response?.data?.detail || "❌ Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DoctorLayout>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-screen px-8 py-10 overflow-y-auto"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* Header */}
        <div className="relative z-10 text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ShieldCheck className="text-cyan-500 w-7 h-7" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
              Upload Patient Record
            </h1>
          </div>
          <p className="text-gray-600 max-w-xl mx-auto text-sm">
            Securely encrypt and upload medical records to the MediChain system using AES-GCM and ECC hybrid encryption.
          </p>
        </div>

        {/* Upload Form */}
        <div className="relative z-10 max-w-2xl mx-auto rounded-3xl p-10 bg-white/70 backdrop-blur-2xl border border-cyan-200/50 shadow-[0_8px_35px_rgba(56,189,248,0.15)]">
          <form onSubmit={handleUpload} className="space-y-8">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Authorized Patient
              </label>
              <select
                className="w-full bg-white/80 border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-cyan-400 outline-none"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">-- Choose Patient --</option>
                {patients.length === 0 ? (
                  <option disabled>No authorized patients found</option>
                ) : (
                  patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Record File
              </label>
              <div className="relative border-2 border-dashed border-cyan-300 rounded-2xl p-6 bg-white/70 hover:bg-white/90 transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-blue-600 file:text-white hover:file:opacity-90"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-cyan-600 flex items-center gap-2">
                    <FileText size={16} /> {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes / Description
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter brief notes about the record..."
                className="w-full bg-white/80 border border-gray-300 rounded-xl p-3 text-gray-700 focus:ring-2 focus:ring-cyan-400 outline-none h-28 resize-none"
              />
            </div>

            {/* Upload Button */}
            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full py-3 justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Upload Record
                </>
              )}
            </PrimaryButton>
          </form>
        </div>
      </motion.div>
    </DoctorLayout>
  );
};

export default DoctorUploadPage;
