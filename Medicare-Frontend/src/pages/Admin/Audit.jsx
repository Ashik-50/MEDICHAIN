import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import { Clock, User, Download, Loader2 } from "lucide-react";
import api from "@/services/api";
import { toast } from "react-hot-toast";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await api.get("/admin/audit-logs");
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await api.get("/admin/audit-logs/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "audit_logs.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Audit logs downloaded successfully");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download CSV");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) =>
    [log.doctor_name, log.patient_name, log.action, log.timestamp]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <motion.div
        className="relative min-h-screen px-8 py-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* 🌈 Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* 🧾 Header */}
        <div className="relative z-10 flex justify-between items-center mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
              Audit Logs
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Track all MediChain access events for compliance and traceability.
            </p>
          </div>

          {/* ✅ PrimaryButton used for CSV Download */}
          <PrimaryButton
            onClick={downloadCSV}
            className="px-5 py-3 text-sm md:text-base font-semibold"
          >
            <Download size={18} /> Download CSV
          </PrimaryButton>
        </div>

        {/* 🔍 Search Bar */}
        <div className="relative z-10 max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="Search logs by doctor, patient, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/70 border border-cyan-200/50 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
          />
        </div>

        {/* 📋 Logs Table */}
        <div className="relative z-10">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-gray-500">
              <Loader2 className="animate-spin w-8 h-8 text-cyan-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500 italic">No logs found.</p>
          ) : (
            <motion.div
              className="overflow-x-auto bg-white/80 backdrop-blur-2xl border border-cyan-200/50 rounded-3xl p-6 shadow-[0_8px_35px_rgba(56,189,248,0.15)]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-gray-700 text-sm uppercase border-b border-cyan-200/50">
                    <th className="px-5 py-3">Doctor</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => (
                    <motion.tr
                      key={log.id || i}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/90 hover:bg-white shadow-[0_2px_15px_rgba(56,189,248,0.08)] transition-all rounded-xl"
                    >
                      <td className="px-5 py-3 flex items-center gap-2 text-gray-800 font-medium">
                        <User size={15} className="text-cyan-500" />
                        {log.doctor_name}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {log.patient_name}
                      </td>
                      <td className="px-5 py-3 text-blue-600 font-medium">
                        {log.action}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500 flex items-center justify-end gap-1">
                        <Clock size={12} />{" "}
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
