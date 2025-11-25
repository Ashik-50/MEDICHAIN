import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, FileDown, User2 } from "lucide-react";
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

  const handleDownload = async (recordId, fileName) => {
    try {
      const token = localStorage.getItem("token");
      const privateKey = localStorage.getItem("privateKey");
      if (!privateKey) return toast.error("Private key missing. Please re-login.");

      toast.loading("Decrypting file...", { id: "decrypt" });
      const response = await fetch(`http://127.0.0.1:8000/record/doctor/decrypt/${recordId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ private_key_pem: privateKey.replace(/\\n/g, "\n") }),
      });

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
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
              My Patients
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Manage and access records of your connected patients securely.
            </p>
          </div>

          <div className="relative mt-4 sm:mt-0 w-full sm:w-80">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl 
                         pl-10 pr-4 py-2 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-cyan-300"
            />
          </div>
        </div>

        <section className="relative z-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <User2 className="text-cyan-500" /> Active Patients
          </h2>

          {filterBySearch(activePatients).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filterBySearch(activePatients).map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 
                             shadow-[0_8px_30px_rgba(56,189,248,0.15)] hover:shadow-[0_8px_40px_rgba(56,189,248,0.25)] 
                             transition-all duration-500 hover:-translate-y-1 p-6 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{p.name}</h3>
                    <p className="text-gray-500 text-sm mb-1">{p.email}</p>
                    <p className="text-gray-400 text-sm italic line-clamp-2">{p.description}</p>
                  </div>

                  <button
                    onClick={() => handleViewRecords(p)}
                    className="mt-5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-2 rounded-xl 
                               hover:from-sky-600 hover:to-cyan-600 transition-all font-medium shadow-sm"
                  >
                    <FileDown size={16} className="inline mr-2" />
                    View Records
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">No active patients yet.</p>
          )}
        </section>

        {/* 📁 Record Modal */}
        {/* 📁 Record Modal */}
<AnimatePresence>
  {modalOpen && selectedPatient && (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl 
                   p-8 w-full max-w-3xl shadow-[0_0_40px_rgba(56,189,248,0.3)]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-5">
          {selectedPatient.name}'s Records
        </h2>

        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-cyan-300 scrollbar-track-transparent">
          {records.length > 0 ? (
            records.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-[#F7FBFF] to-[#EBF5FF] 
                           border border-white/60 hover:border-cyan-300/60 hover:bg-gradient-to-r hover:from-[#E8F4FF] hover:to-[#DFF0FF] 
                           transition-all"
              >
                <p className="text-gray-800 font-medium truncate max-w-[70%] text-[15px]">
                  {r.file_name}
                </p>
                <button
                  onClick={() => handleDownload(r.id, r.file_name)}
                  className="bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-500 hover:to-cyan-500
                             text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-all duration-300
                             active:scale-[0.98]"
                >
                  <FileDown size={14} className="inline mr-1 mb-[1px]" />
                  Download
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic text-center">No records found.</p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => setModalOpen(false)}
            className="bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-500 hover:to-cyan-500 
                       text-white font-medium py-2 px-8 rounded-xl transition-all duration-300 active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      </motion.div>
    </DoctorLayout>
  );
}
