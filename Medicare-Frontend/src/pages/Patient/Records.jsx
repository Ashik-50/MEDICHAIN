import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileDown, Shield, Loader2, Upload, FolderLock, FilePlus2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import DashboardLayout from "../../components/DashboardLayout";
import PrimaryButton from "@/components/ui/PrimaryButton"; // ✅ Import your shared button

// --- All encryption logic unchanged ---
const generateAESKey = async () =>
  await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);

const uint8ToBase64 = (u8arr) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < u8arr.length; i += chunkSize) {
    const chunk = u8arr.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
};

const aesGcmEncrypt = async (fileBuffer, aesKey) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, fileBuffer);
  const ciphertext = new Uint8Array(cipherBuffer);
  return { ciphertextB64: uint8ToBase64(ciphertext), nonceB64: uint8ToBase64(iv) };
};

const eccWrapAESKey = async (recipientPublicKeyPem, aesKey) => {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const b64 = recipientPublicKeyPem.replace(pemHeader, "").replace(pemFooter, "").replace(/\n/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const recipientKey = await crypto.subtle.importKey("spki", der.buffer, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ephKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const sharedSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: recipientKey }, ephKeyPair.privateKey, 256);
  const kek = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", sharedSecret), "AES-GCM", false, ["encrypt"]);
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, kek, rawAesKey);
  const ephPubSpki = await crypto.subtle.exportKey("spki", ephKeyPair.publicKey);

  return {
    wrappedB64: uint8ToBase64(new Uint8Array(wrapped)),
    nonceB64: uint8ToBase64(wrapIv),
    ephPubSpkiB64: uint8ToBase64(new Uint8Array(ephPubSpki)),
  };
};

const PatientRecords = () => {
  const patientId = localStorage.getItem("id");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [fileName, setFileName] = useState("No file selected");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get(`/record/my-records/${patientId}`);
        setRecords(res.data || []);
      } catch {
        toast.error("Error fetching records");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [patientId]);

  const handleDecrypt = async (record) => {
    setProcessing(record.id);
    try {
      const privateKey = localStorage.getItem("privateKey");
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/record/decrypt/${record.id}`,
        { private_key_pem: privateKey.replace(/\\n/g, "\n") },
        { responseType: "blob", headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.file_name || "record";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Record decrypted & downloaded successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Decryption failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = document.getElementById("patientFile").files[0];
    if (!file) return toast.error("Please select a file first!");

    try {
      setProcessing("upload");
      const keyRes = await api.get(`/auth/get-keys`);
      const { public_key } = keyRes.data;

      const fileBuffer = await file.arrayBuffer();
      const aesKey = await generateAESKey();
      const encryptedFile = await aesGcmEncrypt(fileBuffer, aesKey);
      const wrapped = await eccWrapAESKey(public_key, aesKey);

      const formData = new FormData();
      formData.append(
        "file",
        new File([Uint8Array.from(atob(encryptedFile.ciphertextB64), (c) => c.charCodeAt(0))], file.name, { type: file.type })
      );
      formData.append("description", "Patient self-uploaded record");
      formData.append("file_nonce_b64", encryptedFile.nonceB64);
      formData.append("wrapped_key", JSON.stringify(wrapped));

      const res = await api.post("/record/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Record uploaded securely!`);
      setRecords((prev) => [res.data, ...prev]);
      setFileName("No file selected");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout role="patient">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-screen overflow-hidden px-8 py-10"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0F8FF] via-[#EAF4FF] to-[#E1EEFF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-10">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md mr-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
                My Encrypted Medical Records
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Upload, store, and decrypt your data securely with MediChain.
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-2xl shadow-[0_8px_40px_rgba(56,189,248,0.15)] mb-10">
            <div className="flex items-center gap-3 mb-5">
              <FolderLock className="w-6 h-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">Upload Record</h2>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
              <label
                htmlFor="patientFile"
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-2.5 rounded-xl font-medium cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_30px_rgba(56,189,248,0.35)] transition"
              >
                <FilePlus2 className="w-5 h-5" /> Choose File
              </label>
              <input
                id="patientFile"
                type="file"
                className="hidden"
                onChange={(e) =>
                  setFileName(e.target.files?.[0]?.name || "No file selected")
                }
              />
              <span className="flex-1 text-gray-500 italic text-sm border-b border-gray-300/40 pb-1">
                {fileName}
              </span>

              <div className="sm:w-auto w-full">
                <PrimaryButton
                  type="submit"
                  loading={processing === "upload"}
                  className="px-6 py-2.5"
                >
                  <Upload className="w-4 h-4" /> Upload Securely
                </PrimaryButton>
              </div>
            </form>
          </div>

          {/* Records Table */}
          <div className="overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl shadow-[0_8px_40px_rgba(56,189,248,0.15)]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <p className="text-center text-gray-500 py-20 text-lg italic">
                No medical records found.
              </p>
            ) : (
              <table className="w-full text-gray-700">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm uppercase">
                  <tr>
                    <th className="py-4 px-6 text-left font-medium">Record ID</th>
                    <th className="py-4 px-6 text-left font-medium">File Name</th>
                    <th className="py-4 px-6 text-left font-medium">Doctor</th>
                    <th className="py-4 px-6 text-left font-medium">Date</th>
                    <th className="py-4 px-6 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, idx) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all duration-300"
                    >
                      <td className="py-3 px-6 font-medium">{record.id}</td>
                      <td className="py-3 px-6 truncate">{record.file_name}</td>
                      <td className="py-3 px-6">{record.doctor_id || "N/A"}</td>
                      <td className="py-3 px-6">{new Date(record.uploaded_at).toLocaleString()}</td>
                      <td className="py-3 px-6 text-center">
                        <PrimaryButton
                          type="button"
                          loading={processing === record.id}
                          onClick={() => handleDecrypt(record)}
                          className="w-auto px-5 py-2"
                        >
                          <FileDown className="w-4 h-4" /> Decrypt
                        </PrimaryButton>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PatientRecords;
