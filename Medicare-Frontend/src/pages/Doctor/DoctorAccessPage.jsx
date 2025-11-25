import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import DoctorLayout from "../../components/DoctorLayout";
import {
  respondToConnection,
  getPendingRequests,
} from "@/services/connectionService";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function DoctorAccessPage() {
  const { user } = useAuth();
  const doctorId = user?.id || localStorage.getItem("doctorId");
  const [patients, setPatients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccessData = async () => {
    try {
      const [accessRes, pendingRes] = await Promise.all([
        api.get(`/access/doctor/${doctorId}`),
        getPendingRequests(doctorId),
      ]);
      setPatients(accessRes.data.granted || []);
      setPendingRequests(pendingRes || []);
    } catch (err) {
      console.error("Error fetching access data:", err);
      toast.error("Failed to load access details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessData();
  }, [doctorId]);

  const handleRespond = async (connectionId, action) => {
    try {
      toast.loading(
        `${action === "accept" ? "Accepting" : "Rejecting"} request...`,
        { id: "respond" }
      );
      await respondToConnection(connectionId, action);
      toast.success(
        `Request ${action === "accept" ? "accepted" : "rejected"} successfully`,
        { id: "respond" }
      );
      fetchAccessData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update request", { id: "respond" });
    }
  };

  const handleRevoke = async (patientId) => {
    try {
      toast.loading("Revoking connection...", { id: "revoke" });
      await api.delete(`/connections/revoke`, {
        params: { patient_id: patientId },
      });
      toast.success("Connection revoked successfully", { id: "revoke" });
      fetchAccessData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to revoke connection", {
        id: "revoke",
      });
    }
  };

  return (
    <DoctorLayout>
      <motion.div
        className="relative min-h-screen px-8 py-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* ✨ Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        <div className="relative z-10 space-y-10">
          {/* 🛡 Header */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-cyan-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
                Access Control
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage connection requests and view your connected patients.
              </p>
            </div>
          </motion.div>

          {/* 🌀 Loading Spinner */}
          {loading ? (
            <div className="flex justify-center items-center h-[60vh]">
              <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* 🟡 Pending Requests */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="backdrop-blur-xl bg-white/60 border border-yellow-300/40 rounded-3xl p-6 shadow-[0_8px_30px_rgba(250,204,21,0.15)]"
              >
                <h2 className="text-2xl font-semibold text-yellow-600 mb-6 flex items-center gap-2">
                  Pending Requests
                </h2>

                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 italic">No pending requests.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pendingRequests.map((req, index) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-6 rounded-2xl bg-white/80 border border-yellow-200/50 backdrop-blur-md 
                                   shadow-md hover:shadow-lg hover:shadow-yellow-200/40 transition-all"
                      >
                        <h3 className="text-lg font-semibold text-gray-800">
                          {req.name}
                        </h3>
                        <p className="text-sm text-gray-500">{req.email}</p>
                        <div className="mt-5 flex gap-3">
                          <PrimaryButton
                            onClick={() => handleRespond(req.id, "accept")}
                            className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-400"
                          >
                            <UserCheck size={16} /> Accept
                          </PrimaryButton>
                          <PrimaryButton
                            onClick={() => handleRespond(req.id, "reject")}
                            className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-red-400"
                          >
                            <UserX size={16} /> Reject
                          </PrimaryButton>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>

              {/* 🔷 Connected Patients */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="backdrop-blur-xl bg-white/60 border border-cyan-300/40 rounded-3xl p-6 shadow-[0_8px_30px_rgba(56,189,248,0.15)]"
              >
                <h2 className="text-2xl font-semibold text-cyan-600 mb-6">
                  Connected Patients
                </h2>

                {patients.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No connected patients found.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/40 bg-white/70 shadow-inner">
                    <table className="w-full text-sm text-gray-700">
                      <thead className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
                        <tr>
                          <th className="py-4 px-6 text-left font-medium tracking-wide">
                            Patient ID
                          </th>
                          <th className="py-4 px-6 text-left font-medium tracking-wide">
                            Name
                          </th>
                          <th className="py-4 px-6 text-left font-medium tracking-wide">
                            Status
                          </th>
                          <th className="py-4 px-6 text-left font-medium tracking-wide">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((p) => (
                          <motion.tr
                            key={p.id}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                            className="border-b border-cyan-100 hover:bg-cyan-50 transition-all"
                          >
                            <td className="py-3 px-6">{p.id}</td>
                            <td className="py-3 px-6 font-medium text-gray-800">
                              {p.name}
                            </td>
                            <td className="py-3 px-6">
                              <span
                                className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                                  p.status === "approved"
                                    ? "bg-green-100 text-green-600"
                                    : p.status === "pending"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {p.status === "approved"
                                  ? "Granted"
                                  : p.status === "pending"
                                  ? "Pending"
                                  : "Revoked"}
                              </span>
                            </td>
                            <td className="py-3 px-6">
                              {p.status === "approved" && (
                                <PrimaryButton
                                  onClick={() => handleRevoke(p.id)}
                                  className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500"
                                >
                                  Revoke
                                </PrimaryButton>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.section>
            </div>
          )}
        </div>
      </motion.div>
    </DoctorLayout>
  );
}
