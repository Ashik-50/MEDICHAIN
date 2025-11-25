import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldX, ShieldCheck, Search, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function AccessControl() {
  const { user } = useAuth();
  const patientId = user?.id;

  const [doctors, setDoctors] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState({});
  const [grantedDoctors, setGrantedDoctors] = useState([]);
  const [loading, setLoading] = useState({ doctors: false, records: false, granted: false });
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  const openModal = (grant) => {
    setSelectedGrant(grant);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedGrant(null);
    setShowModal(false);
  };

  // --- Fetch Connected Doctors ---
  const fetchDoctors = async () => {
    setLoading((l) => ({ ...l, doctors: true }));
    try {
      const res = await api.get(`/connections/doctors?patient_id=${patientId}`);
      const connectedOnly = (res.data.doctors || []).filter(
        (d) => d.status === "accepted" || d.status === "connected"
      );
      setDoctors(connectedOnly);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading((l) => ({ ...l, doctors: false }));
    }
  };

  // --- Fetch Patient’s Records ---
  const fetchRecords = async () => {
    setLoading((l) => ({ ...l, records: true }));
    try {
      const res = await api.get(`/record/my-records/${patientId}`);
      setRecords(res.data || []);
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading((l) => ({ ...l, records: false }));
    }
  };

  // --- Fetch Granted Access ---
  const fetchGranted = async () => {
    setLoading((l) => ({ ...l, granted: true }));
    try {
      const res = await api.get(`/access/patient/${patientId}`);
      setGrantedDoctors(res.data.granted || []);
    } catch {
      toast.error("Failed to load granted doctors");
    } finally {
      setLoading((l) => ({ ...l, granted: false }));
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchDoctors();
      fetchRecords();
      fetchGranted();
    }
  }, [patientId]);

  // --- Grant Access ---
  const handleGrant = async (doctorId) => {
    const recordId = selectedRecord[String(doctorId)];
    if (!recordId) return toast.error("Please select a record first");
    setActionLoading(`grant-${doctorId}`);
    try {
      const privateKeyPem = localStorage.getItem("privateKey");
      await api.post("/access/grant-key", {
        doctor_id: doctorId,
        record_id: recordId,
        private_key_pem: privateKeyPem,
      });
      toast.success("Access granted successfully");
      await fetchGranted();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Grant failed");
    } finally {
      setActionLoading(null);
    }
  };

  // --- Revoke Access ---
  const handleRevoke = async (doctorId, recordId) => {
    if (!confirm("Revoke access for this record?")) return;
    setActionLoading(`revoke-${doctorId}-${recordId}`);
    try {
      await api.post(`/access/revoke?doctor_id=${doctorId}&record_id=${recordId}`);
      toast.success("Access revoked successfully");
      await fetchGranted();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Revoke failed");
    } finally {
      setActionLoading(null);
    }
  };

  // --- Search Filter ---
  const filteredDoctors = doctors.filter((d) => {
    const q = search.toLowerCase();
    return (
      !search ||
      d.name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout role="patient">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative min-h-screen px-8 py-10"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0F8FF] via-[#EAF4FF] to-[#E1EEFF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500">
            Access Control
          </h1>

          {/* Search Bar */}
          <div className="relative mb-10">
            <Search className="absolute left-4 top-3 text-cyan-500" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connected doctors..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/70 text-gray-800 placeholder-gray-500 shadow-sm focus:ring-2 focus:ring-cyan-400 outline-none"
            />
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Grant Access Section */}
            <div className="p-6 bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_40px_rgba(56,189,248,0.15)]">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-cyan-500" /> Grant Record Access
              </h2>

              {loading.doctors ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-cyan-500" size={28} />
                </div>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-10 italic">
                  No connected doctors available.
                </p>
              ) : (
                <div className="space-y-5 max-h-[70vh] overflow-y-auto">
                  {filteredDoctors.map((doc) => (
                    <motion.div
                      key={doc.doctor_id}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 bg-white/60 border border-white/40 rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{doc.name}</h3>
                      <p className="text-cyan-500 text-sm">
                        {doc.specialization || "General Practitioner"}
                      </p>

                      <div className="mt-3">
                        <label className="text-xs text-gray-500">
                          Select record to grant access:
                        </label>
                        <select
                          value={selectedRecord[String(doc.doctor_id)] || ""}
                          onChange={(e) =>
                            setSelectedRecord((prev) => ({
                              ...prev,
                              [String(doc.doctor_id)]: e.target.value,
                            }))
                          }
                          className="w-full mt-1 bg-white/80 border border-gray-300 text-gray-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-cyan-400 outline-none"
                        >
                          <option value="">-- Choose Record --</option>
                          {records.map((rec) => (
                            <option key={rec.id} value={rec.id}>
                              {rec.file_name} (
                              {new Date(rec.uploaded_at).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4">
                        <PrimaryButton
                          onClick={() => handleGrant(doc.doctor_id)}
                          loading={actionLoading === `grant-${doc.doctor_id}`}
                        >
                          <FileText size={16} /> Grant Access
                        </PrimaryButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Granted Access Section */}
            <div className="p-6 bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_40px_rgba(56,189,248,0.15)]">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldX className="text-rose-500" /> Granted Access
              </h2>

              {loading.granted ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-cyan-500" size={28} />
                </div>
              ) : grantedDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-10 italic">
                  No doctors currently have access.
                </p>
              ) : (
                <div className="space-y-5 max-h-[70vh] overflow-y-auto">
                  {grantedDoctors.map((d) => (
                    <motion.div
                      key={`${d.id}-${d.record_id}`}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 bg-white/60 border border-white/40 rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="font-semibold text-gray-800">{d.name}</div>
                      <div className="text-sm text-cyan-600 mt-1 flex items-center gap-2">
                        <FileText size={14} /> {d.file_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Granted: {new Date(d.grantedAt || Date.now()).toLocaleString()}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <PrimaryButton onClick={() => openModal(d)} className="w-1/2">
                          <FileText size={16} /> View Details
                        </PrimaryButton>

                        <PrimaryButton
                          onClick={() => handleRevoke(d.id, d.record_id)}
                          loading={actionLoading === `revoke-${d.id}-${d.record_id}`}
                          className="w-1/2 bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-pink-200/50"
                        >
                          <ShieldX size={16} /> Revoke
                        </PrimaryButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedGrant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-[90%] max-w-md bg-white/80 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_40px_rgba(56,189,248,0.15)] border border-white/50"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Record Details
              </h2>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  <span className="text-gray-500">Doctor:</span> {selectedGrant.name}
                </p>
                <p>
                  <span className="text-gray-500">Specialization:</span>{" "}
                  {selectedGrant.specialization || "General Physician"}
                </p>
                <p>
                  <span className="text-gray-500">File:</span>{" "}
                  <span className="text-cyan-600">{selectedGrant.file_name}</span>
                </p>
                <p>
                  <span className="text-gray-500">Granted On:</span>{" "}
                  {new Date(selectedGrant.grantedAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <PrimaryButton onClick={closeModal} className="w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800">
                  Close
                </PrimaryButton>
                <PrimaryButton
                  onClick={() => {
                    handleRevoke(selectedGrant.id, selectedGrant.record_id);
                    closeModal();
                  }}
                  className="w-1/2 bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-pink-200/50"
                >
                  Revoke Access
                </PrimaryButton>
              </div>

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-lg"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
