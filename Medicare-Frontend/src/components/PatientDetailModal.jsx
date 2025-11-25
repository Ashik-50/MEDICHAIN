// src/components/PatientDetailModal.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, FileText, Download } from "lucide-react";
import { recordService } from "@/services/recordService";
import { toast } from "react-hot-toast";

export default function PatientDetailModal({ patient, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await recordService.getPatientRecords(patient.id);
        setRecords(data);
      } catch (err) {
        console.error("Error fetching records", err);
        toast.error("Failed to load patient records.");
      } finally {
        setLoading(false);
      }
    };

    if (patient?.id) fetchRecords();
  }, [patient]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-[#0A163F]/90 border border-white/10 rounded-2xl p-6 w-[90%] sm:w-[600px] backdrop-blur-xl shadow-lg relative"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X size={22} />
        </button>

        <h2 className="text-2xl font-semibold text-cyan-300 mb-2">
          {patient.name}
        </h2>
        <p className="text-gray-400 text-sm mb-4">{patient.email}</p>

        {/* Records Section */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">
            Medical Records
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-cyan-400" size={28} />
            </div>
          ) : records.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between items-start bg-[#111B4C]/70 p-3 rounded-lg border border-white/10"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="text-cyan-400" size={18} />
                      <span className="font-medium text-gray-200">
                        {record.file_name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {record.notes || "No notes available."}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      recordService.downloadRecord(record.id, record.file_name)
                    }
                    className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              No records available for this patient.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
