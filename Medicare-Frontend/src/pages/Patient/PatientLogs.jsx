import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, ClipboardList, RefreshCw } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { toast } from "react-hot-toast";
import api from "@/services/api";

const PatientLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const patientId = localStorage.getItem("id");

  // ⏰ Format Timestamp
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  // 🔄 Fetch Access Logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/access/logs/patient/${patientId}`);
        setLogs(res.data.logs || []);
      } catch (err) {
        toast.error("Failed to load activity logs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [patientId]);

  // 🧩 Refresh Logs
  const refreshLogs = async () => {
    toast.loading("Refreshing logs...");
    try {
      const res = await api.get(`/access/logs/patient/${patientId}`);
      setLogs(res.data.logs || []);
      toast.dismiss();
      toast.success("Logs updated successfully");
    } catch {
      toast.dismiss();
      toast.error("Failed to refresh logs");
    }
  };

  return (
    <DashboardLayout role="patient">
      <motion.div
        className="relative min-h-screen px-8 py-12 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 🌈 Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0F8FF] via-[#EAF4FF] to-[#E1EEFF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_75%_75%,rgba(37,99,235,0.15),transparent_60%)] blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="flex items-center justify-center mb-10"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md mr-3">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
              Patient Activity Logs
            </h1>
          </motion.div>

          {/* Refresh Button */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <PrimaryButton onClick={refreshLogs} className="flex items-center gap-2 w-auto px-6">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Refresh Logs
            </PrimaryButton>
          </motion.div>

          {/* Logs Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
              <FileText className="text-cyan-500" /> Access History
            </h2>

            {loading ? (
              <p className="text-center text-gray-500 italic">Loading activity logs...</p>
            ) : logs.length > 0 ? (
              <motion.div
                className="overflow-x-auto rounded-3xl backdrop-blur-2xl bg-white/70 border border-white/50 shadow-[0_8px_40px_rgba(56,189,248,0.15)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm uppercase">
                    <tr>
                      {["Doctor Name", "Record", "Action", "Timestamp"].map((head) => (
                        <th key={head} className="py-4 px-6 text-left font-semibold tracking-wide">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <motion.tr
                        key={index}
                        className="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all duration-300 cursor-pointer border-b border-gray-200"
                        whileHover={{ scale: 1.01 }}
                      >
                        <td className="py-3 px-6 font-medium text-gray-800">
                          {log.doctor_name}
                        </td>
                        <td className="py-3 px-6 flex items-center gap-2 text-cyan-600 font-medium">
                          <FileText className="w-4 h-4 text-cyan-500" />
                          {log.record_name}
                        </td>
                        <td className="py-3 px-6 text-blue-600 font-medium">{log.action}</td>
                        <td className="py-3 px-6 text-gray-500">{formatDate(log.timestamp)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <p className="text-center text-gray-500 italic">
                No recent access logs available.
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PatientLogs;
