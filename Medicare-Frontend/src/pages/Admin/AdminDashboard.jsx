import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import { getAllUsers } from "../../services/adminService";
import { getLedger } from "../../services/blockchainService";
import api from "@/services/api";
import { Users, Blocks, FileText } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, blocks: 0, records: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, ledgerRes, userRes] = await Promise.all([
        api.get("/admin/stats"),
        getLedger(),
        getAllUsers(),
      ]);
      setStats({
        users: userRes.data.users?.length || 0,
        blocks: ledgerRes.data.blocks?.length || 0,
        records: statsRes.data.records || 0,
      });
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cards = [
    {
      icon: Users,
      title: "Total Users",
      value: stats.users,
      color: "from-cyan-400/80 to-blue-500/80",
      glow: "shadow-[0_0_25px_rgba(56,189,248,0.2)]",
    },
    {
      icon: FileText,
      title: "Records Uploaded",
      value: stats.records,
      color: "from-emerald-400/80 to-teal-500/80",
      glow: "shadow-[0_0_25px_rgba(16,185,129,0.2)]",
    },
    {
      icon: Blocks,
      title: "Blockchain Blocks",
      value: stats.blocks,
      color: "from-blue-400/80 to-indigo-500/80",
      glow: "shadow-[0_0_25px_rgba(59,130,246,0.2)]",
    },
  ];

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

        {/* 🧠 Header */}
        <div className="relative z-10 text-center mb-12">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Monitor system-wide activity across users, records, and blockchain integrity.
          </p>
        </div>

        {/* 📊 Stats Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {cards.map(({ icon: Icon, title, value, color, glow }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.04, y: -5 }}
              className={`group rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/40 p-8 
                          shadow-[0_8px_35px_rgba(56,189,248,0.12)] hover:shadow-[0_8px_40px_rgba(56,189,248,0.25)] 
                          transition-all duration-300 text-center ${glow}`}
            >
              <div
                className={`mx-auto mb-6 w-16 h-16 flex items-center justify-center rounded-2xl 
                            bg-gradient-to-r ${color} text-white shadow-md group-hover:scale-110 transition-transform`}
              >
                <Icon size={30} />
              </div>
              <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
              <p className="text-5xl font-extrabold mt-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
                {loading ? "..." : value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* 🩺 Footer Hint */}
        <div className="relative z-10 text-center mt-16 text-gray-500 text-sm">
          Powered by <span className="text-cyan-600 font-semibold">MediChain Admin Portal</span> — ensuring
          transparency and security in healthcare data.
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
