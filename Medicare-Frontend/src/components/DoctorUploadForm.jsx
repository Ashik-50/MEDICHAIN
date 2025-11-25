import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, ShieldCheck, Loader2, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useEncrypt } from "@/hooks/useEncrypt";
import { useDecrypt } from "@/hooks/useDecrypt";
import api from "@/services/api";
import toast, { Toaster } from "react-hot-toast";
import Lottie from "lottie-react";
import uploadAnim from "@/assets/lottie/uploading.json"; // Add a Lottie animation file here (from lottiefiles.com)

const DoctorUploadForm = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [blockHash, setBlockHash] = useState("");
  const dropRef = useRef(null);

  const { encryptFile } = useEncrypt();
  const { decryptFile } = useDecrypt();

  const handleFileSelect = (fileObj) => {
    setFile(fileObj);
    setProgress(0);
    if (fileObj.type.startsWith("image/") || fileObj.type === "application/pdf") {
      setPreviewUrl(URL.createObjectURL(fileObj));
    } else {
      setPreviewUrl("");
    }
  };

  const handleFileChange = (e) => handleFileSelect(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
    dropRef.current.classList.remove("border-blue-600");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add("border-blue-600");
  };

  const handleDragLeave = () => dropRef.current.classList.remove("border-blue-600");

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    try {
      toast.loading("Encrypting file...");
      setProgress(25);

      const encryptedData = await encryptFile(file);
      setProgress(60);

      const formData = new FormData();
      formData.append("file", encryptedData.blob);
      formData.append("metadata", JSON.stringify(encryptedData.meta));

      toast.dismiss();
      toast.loading("Uploading securely...");

      const res = await api.post("/doctor/upload", formData);
      toast.dismiss();
      toast.success("File uploaded successfully!");
      setProgress(100);

      setBlockHash(res.data?.block_hash || "N/A");
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Upload failed. Please try again.");
      setProgress(0);
    }
  };

  const handleDecryptPreview = async () => {
    try {
      toast.loading("Decrypting...");
      const result = await decryptFile(file.name);
      toast.dismiss();
      toast.success("Decryption successful!");
      window.open(URL.createObjectURL(new Blob([result])), "_blank");
    } catch {
      toast.dismiss();
      toast.error("Decryption failed.");
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <motion.div
        className="flex justify-center items-center min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-100 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="w-full max-w-2xl backdrop-blur-xl bg-white/80 shadow-2xl border border-white/30 rounded-3xl">
          <CardHeader className="text-center pb-4">
            <motion.h2
              className="text-2xl font-bold text-blue-700"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Secure Record Upload
            </motion.h2>
            <p className="text-gray-500 text-sm">
              Encrypt, upload, and verify medical records securely.
            </p>
          </CardHeader>

          <CardContent>
            <motion.div
              ref={dropRef}
              className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-2xl p-8 bg-blue-50/60 hover:bg-blue-100 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <Upload className="text-blue-600 w-12 h-12 mb-3" />
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.dicom,.txt"
                onChange={handleFileChange}
                hidden
              />
              <p className="text-gray-600">
                {file ? (
                  <>
                    <FileText className="inline w-5 h-5 mr-1" /> {file.name}
                  </>
                ) : (
                  "Click or drag file to upload"
                )}
              </p>
            </motion.div>

            {previewUrl && (
              <motion.div
                className="mt-6 rounded-xl overflow-hidden shadow-md bg-white/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-80 object-contain"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    className="w-full h-80"
                  ></iframe>
                )}
              </motion.div>
            )}

            <div className="mt-6 flex justify-center space-x-4">
              <Button
                onClick={handleUpload}
                disabled={!file}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                {progress < 100 ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
                {progress < 100 ? "Uploading..." : "Upload Complete"}
              </Button>

              <Button
                onClick={handleDecryptPreview}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Eye className="w-5 h-5" /> Decrypt Preview
              </Button>
            </div>

            {progress > 0 && progress < 100 && (
              <motion.div
                className="mt-4 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Lottie
                  animationData={uploadAnim}
                  loop
                  className="w-32 h-32 mb-2"
                />
                <motion.div
                  className="h-2 bg-blue-200 rounded-full w-full overflow-hidden"
                  animate={{ width: `${progress}%` }}
                >
                  <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {showModal && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-2xl text-center w-[400px]"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <ShieldCheck className="text-green-600 w-12 h-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">Upload Successful!</h3>
            <p className="text-gray-600 text-sm mb-4">
              Record added to blockchain successfully.
            </p>
            <div className="bg-gray-100 rounded-md p-2 mb-4 text-xs font-mono">
              Block Hash: <span className="text-blue-700">{blockHash}</span>
            </div>
            <Button
              onClick={() => setShowModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default DoctorUploadForm;
