import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function FindDoctor() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/connections/doctors?patient_id=${user.id}`);
      const doctorList = res.data.doctors || [];
      const statusOrder = { accepted: 1, pending: 2, none: 3 };
      setDoctors(doctorList.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]));
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleConnect = async (doctorId) => {
    setConnecting(true);
    try {
      await api.post(`/connections/request`, {
        patient_id: user.id,
        doctor_id: doctorId,
      });
      toast.success("Connection request sent!");
      await fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <DashboardLayout role="patient">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative min-h-screen overflow-hidden px-8 py-10"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0F8FF] via-[#EAF4FF] to-[#E1EEFF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
                Find Doctors
              </h1>
              <p className="text-gray-600 text-sm mt-2">
                Browse verified professionals and connect securely.
              </p>
            </div>
          </div>

          {/* Doctor Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.map((doc, idx) => (
                <motion.div
                  key={doc.doctor_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  className="relative p-6 rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/40 
                             shadow-[0_8px_30px_rgba(56,189,248,0.1)] hover:shadow-[0_8px_40px_rgba(56,189,248,0.2)] 
                             transition-all duration-300"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {doc.name}
                      </h3>
                      <p className="text-cyan-500 text-sm font-medium">
                        {doc.specialization || "General Practitioner"}
                      </p>
                      <p className="text-gray-600 text-sm mt-3 line-clamp-3 leading-relaxed">
                        {doc.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <button
                        onClick={() => setSelectedDoctor(doc)}
                        className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 
                                   rounded-lg text-gray-700 bg-white/60 hover:bg-white/80 
                                   transition-all shadow-sm"
                      >
                        <Eye size={16} /> View
                      </button>

                      {doc.status === "none" && (
                        <PrimaryButton
                          onClick={() => handleConnect(doc.doctor_id)}
                          loading={connecting}
                          className="w-auto px-5 py-2"
                        >
                          Connect
                        </PrimaryButton>
                      )}

                      {doc.status === "pending" && (
                        <span className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                          <Clock size={16} /> Pending
                        </span>
                      )}

                      {doc.status === "accepted" && (
                        <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
                          <CheckCircle2 size={16} /> Connected
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Doctor Details Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-[90%] max-w-md bg-white/80 backdrop-blur-2xl 
                         p-8 rounded-3xl shadow-[0_8px_40px_rgba(56,189,248,0.2)] border border-white/50"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {selectedDoctor.name}
              </h2>
              <p className="text-cyan-500 text-sm mb-3">
                {selectedDoctor.specialization || "General Practitioner"}
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                {selectedDoctor.description || "No description available."}
              </p>

              <div className="flex justify-center gap-4">
                {selectedDoctor.status === "none" && (
                  <PrimaryButton
                    onClick={() => handleConnect(selectedDoctor.doctor_id)}
                    loading={connecting}
                    className="w-auto px-6 py-2"
                  >
                    Send Request
                  </PrimaryButton>
                )}

                {selectedDoctor.status === "pending" && (
                  <span className="flex items-center gap-2 text-yellow-500 font-medium">
                    <Clock size={18} /> Request Pending
                  </span>
                )}

                {selectedDoctor.status === "accepted" && (
                  <span className="flex items-center gap-2 text-green-500 font-medium">
                    <CheckCircle2 size={18} /> Connected
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
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
