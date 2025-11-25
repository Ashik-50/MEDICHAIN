import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, FileText, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import DoctorLayout from "../../components/DoctorLayout";
import api from "@/services/api";
import PrimaryButton from "@/components/ui/PrimaryButton";

const DoctorLogs = () => {
  const { user } = useAuth();
  const doctorId = user?.id || localStorage.getItem("doctorId");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/access/logs/doctor/${doctorId}`);
      setLogs(res.data.logs || []);
    } catch (error) {
      console.error("Error fetching doctor logs:", error);
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) fetchLogs();
  }, [doctorId]);

  const handleRefresh = async () => {
    toast.loading("Refreshing logs...");
    await fetchLogs();
    toast.dismiss();
    toast.success("Logs refreshed");
  };

  return (
    <DoctorLayout>
      <motion.div
        className="relative min-h-screen px-8 py-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* 🌈 Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* 🩺 Header */}
        <div className="relative z-10 flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-3">
            <ClipboardList className="w-8 h-8 text-cyan-500 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
              Doctor Activity Logs
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            View all access and record-related actions associated with your account.
          </p>
        </div>

        {/* 🔁 Refresh Button */}
        <motion.div
          className="relative z-10 flex justify-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <PrimaryButton
            onClick={handleRefresh}
            className="px-6 py-2 w-auto flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            Refresh Logs
          </PrimaryButton>
        </motion.div>

        {/* 📜 Logs Table */}
        {loading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex justify-center items-center h-[60vh]">
            <p className="text-gray-500 text-lg italic">
              No activity logs found.
            </p>
          </div>
        ) : (
          <motion.div
            className="relative z-10 overflow-x-auto rounded-3xl backdrop-blur-2xl bg-white/70 border border-cyan-200/50 shadow-[0_8px_35px_rgba(56,189,248,0.15)]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
                <tr>
                  {["Patient Name", "Record", "Action", "Timestamp"].map((head) => (
                    <th
                      key={head}
                      className="py-4 px-6 text-left font-semibold tracking-wide uppercase"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <motion.tr
                    key={index}
                    className="border-b border-cyan-100/40 hover:bg-cyan-50 transition-all duration-300"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td className="py-3 px-6 font-medium text-gray-800">{log.patient_name}</td>
                    <td className="py-3 px-6 flex items-center gap-2 text-cyan-600 font-medium">
                      <FileText className="w-4 h-4 text-cyan-500" />
                      {log.record_name}
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                          log.action.toLowerCase().includes("upload")
                            ? "bg-green-100 text-green-600"
                            : log.action.toLowerCase().includes("decrypt")
                            ? "bg-blue-100 text-blue-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-gray-600">{formatDate(log.timestamp)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </DoctorLayout>
  );
};

export default DoctorLogs;
