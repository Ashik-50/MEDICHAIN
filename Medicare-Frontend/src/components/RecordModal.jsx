import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { getPatientRecords } from "@/services/recordService";

const RecordModal = ({ patient, isOpen, onClose }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && patient) {
      (async () => {
        try {
          const data = await getPatientRecords(patient.id);
          setRecords(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-gray-700 relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
          >
            <X size={22} />
          </button>

          <h2 className="text-2xl font-semibold text-white mb-4">
            {patient.name}’s Records
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-blue-400" size={40} />
            </div>
          ) : records.length === 0 ? (
            <p className="text-gray-400">No records available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {records.map((r) => (
                <motion.div
                  key={r.id}
                  whileHover={{ scale: 1.03 }}
                  className="flex justify-between items-center bg-gray-800/70 rounded-xl p-4 border border-gray-700 hover:border-blue-400 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-400" size={26} />
                    <div>
                      <p className="text-white font-medium">{r.filename}</p>
                      <p className="text-sm text-gray-400">
                        Uploaded: {new Date(r.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-1.5 bg-blue-500/20 border border-blue-400 text-blue-300 rounded-md text-sm hover:bg-blue-600/30 transition"
                    >
                      View
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-1.5 bg-green-500/20 border border-green-400 text-green-300 rounded-md text-sm hover:bg-green-600/30 transition"
                    >
                      Verify
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecordModal;
