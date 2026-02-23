import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, FileDown, User2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import DoctorLayout from "@/components/DoctorLayout";
import { getActiveConnections } from "@/services/connectionService";
import { recordService } from "@/services/recordService";
import { useAuth } from "@/context/AuthContext";

export default function Patients() {
  const { user } = useAuth();

  const [activePatients, setActivePatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [emergencyReason, setEmergencyReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        const activeRes = await getActiveConnections(user.id);
        const activeList = activeRes.map((conn) => ({
          id: conn.patient_id,
          name: conn.name || "Unnamed Patient",
          email: conn.email,
          description: conn.description,
        }));
        setActivePatients(activeList);
      } catch {
        toast.error("Failed to fetch patient data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filterBySearch = (list) =>
    list.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  const handleViewRecords = async (patient) => {
    try {
      toast.loading("Fetching records...", { id: "fetchRecords" });
      const data = await recordService.getPatientRecords(patient.id);
      setRecords(data);
      setSelectedPatient(patient);
      setModalOpen(true);
      toast.success("Records loaded!", { id: "fetchRecords" });
    } catch {
      toast.error("Failed to load records", { id: "fetchRecords" });
    }
  };

  const handleDownload = async (recordId) => {
    try {
      const token = localStorage.getItem("token");
      const privateKey = localStorage.getItem("privateKey");
      if (!privateKey) return toast.error("Private key missing. Please re-login.");

      toast.loading("Decrypting file...", { id: "decrypt" });

      const response = await fetch(
        `http://127.0.0.1:8000/record/doctor/decrypt/${recordId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            private_key_pem: privateKey.replace(/\\n/g, "\n"),
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Decryption failed");
      }

      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
      URL.revokeObjectURL(fileURL);
      toast.success("File ready!", { id: "decrypt" });
    } catch (err) {
      toast.error(err.message || "Decryption failed", { id: "decrypt" });
    }
  };

  // 🔥 Emergency submit
  const handleEmergencySubmit = async () => {
    try {
      if (emergencyReason.trim().length < 15) {
        return toast.error("Provide detailed emergency reason (min 15 chars)");
      }

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://127.0.0.1:8000/access/emergency-access",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            record_id: selectedRecordId,
            reason: emergencyReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Emergency access failed");
      }

      toast.success("Emergency access granted");

      setEmergencyOpen(false);
      setEmergencyReason("");

      // Optional auto-download after emergency
      handleDownload(selectedRecordId);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading)
    return (
      <DoctorLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="animate-spin text-cyan-500" size={40} />
        </div>
      </DoctorLayout>
    );

  return (
    <DoctorLayout>
      <motion.div
        className="relative min-h-screen px-8 py-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-8">
            My Patients
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filterBySearch(activePatients).map((p) => (
              <div
                key={p.id}
                className="rounded-3xl bg-white shadow-lg p-6"
              >
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.email}</p>

                <button
                  onClick={() => handleViewRecords(p)}
                  className="mt-5 bg-cyan-500 text-white py-2 rounded-xl w-full"
                >
                  View Records
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 📁 Record Modal */}
        <AnimatePresence>
          {modalOpen && selectedPatient && (
            <motion.div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-8 rounded-2xl w-full max-w-3xl">
                <h2 className="text-2xl font-bold mb-5">
                  {selectedPatient.name}'s Records
                </h2>

                <div className="space-y-3">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="flex justify-between items-center p-4 rounded-xl bg-gray-50"
                    >
                      <p className="truncate">{r.file_name}</p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(r.id)}
                          className="bg-cyan-500 text-white px-4 py-1 rounded-lg"
                        >
                          Download
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRecordId(r.id);
                            setEmergencyOpen(true);
                          }}
                          className="bg-red-500 text-white px-4 py-1 rounded-lg flex items-center gap-1"
                        >
                          <AlertTriangle size={14} />
                          Emergency
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="bg-gray-300 px-6 py-2 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚨 Emergency Modal */}
        <AnimatePresence>
          {emergencyOpen && (
            <motion.div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h3 className="text-lg font-semibold text-red-600 mb-3">
                  Emergency Access Reason
                </h3>

                <textarea
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  rows={4}
                  placeholder="Provide detailed emergency reason..."
                />

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setEmergencyOpen(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleEmergencySubmit}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    Confirm Emergency
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DoctorLayout>
  );
}