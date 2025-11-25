import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, FileText } from "lucide-react";
import DoctorLayout from "../../components/DoctorLayout";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

const DoctorDashboard = () => {
  const { token, user } = useAuth();
  const [connectedCount, setConnectedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [latestRecords, setLatestRecords] = useState([]);

  useEffect(() => {
    if (token && user?.id) fetchDashboardData();
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      const [activeRes, pendingRes, recCountRes, latestRes] = await Promise.all([
        api.get(`/connections/active/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/connections/pending/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/record/count/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/record/latest/doctor/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setConnectedCount(activeRes.data.length || 0);
      setPendingCount(pendingRes.data.length || 0);
      setRecordCount(recCountRes.data.record_count || 0);
      setLatestRecords(latestRes.data || []);
    } catch (err) {
      console.error("Dashboard data error:", err);
      toast.error("Failed to load dashboard data");
    }
  };

  // ✅ Dashboard Summary Cards
  const cards = [
    {
      icon: Users,
      title: "Connected Patients",
      count: connectedCount,
      gradient: "from-cyan-400 to-blue-500",
    },
    {
      icon: Clock,
      title: "Pending Requests",
      count: pendingCount,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: FileText,
      title: "Records Uploaded",
      count: recordCount,
      gradient: "from-emerald-400 to-teal-500",
    },
  ];

  return (
    <DoctorLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative px-8 py-12 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F4F9FF] via-[#EEF5FF] to-[#E3F0FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-14">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent tracking-tight">
              Doctor Dashboard
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Monitor your patient network, pending connections, and data activity.
            </p>
          </div>

          {/* Summary Cards */}
          <motion.div
            className="grid sm:grid-cols-3 gap-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {cards.map(({ icon: Icon, title, count, gradient }, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl backdrop-blur-2xl bg-white/70 border border-white/50 
                           shadow-[0_8px_35px_rgba(56,189,248,0.1)] hover:shadow-[0_10px_45px_rgba(56,189,248,0.2)] 
                           transition-all duration-500 p-8 flex flex-col items-center text-center"
              >
                <div
                  className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-r ${gradient} shadow-md mb-4`}
                >
                  <Icon size={26} className="text-white" />
                </div>
                <h2 className="text-base font-semibold text-gray-800">{title}</h2>
                <p className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mt-2">
                  {count}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Latest Uploads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl backdrop-blur-2xl bg-white/70 border border-white/50 
                       shadow-[0_8px_35px_rgba(56,189,248,0.1)] hover:shadow-[0_10px_45px_rgba(56,189,248,0.2)] 
                       transition-all duration-500 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
              Latest Uploads
            </h2>

            {latestRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-700">
                  <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    <tr>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wide rounded-tl-2xl">
                        File Name
                      </th>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wide">
                        Patient
                      </th>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wide rounded-tr-2xl">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestRecords.map((rec, index) => (
                      <motion.tr
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        className="transition-all hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 border-b border-gray-200"
                      >
                        <td className="py-3 px-6 font-medium text-gray-800">{rec.file_name}</td>
                        <td className="py-3 px-6 text-gray-600">{rec.patient_name}</td>
                        <td className="py-3 px-6 text-gray-500">{rec.description || "—"}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic text-center py-12">
                No recent uploads yet.
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
