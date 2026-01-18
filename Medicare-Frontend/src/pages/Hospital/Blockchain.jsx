import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import { Loader2, Blocks, Hash, Clock, ShieldCheck, User } from "lucide-react";
import api from "@/services/api";
import { toast } from "react-hot-toast";

export default function BlockchainLedger() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 🔹 Fetch blockchain ledger
  const fetchBlocks = async () => {
    try {
      const res = await api.get("/blockchain/ledger");
      setBlocks(res.data.blocks || []);
    } catch (err) {
      console.error("Error fetching blockchain:", err);
      toast.error("Failed to load blockchain ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  // 🔹 Filter blocks
  const filteredBlocks = blocks.filter((b) => {
    const searchLower = search.toLowerCase();
    return (
      b.action?.toLowerCase().includes(searchLower) ||
      b.patient_name?.toLowerCase().includes(searchLower) ||
      b.doctor_name?.toLowerCase().includes(searchLower)
    );
  });

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

        {/* 🧱 Header */}
        <div className="relative z-10 text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent">
            Blockchain Ledger
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Track every transaction stored securely on the MediChain network.
          </p>
        </div>

        {/* 🔍 Search Bar */}
        <div className="relative z-10 max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search by doctor, patient, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/70 border border-cyan-200/50 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
          />
        </div>

        {/* 🪶 Ledger Cards */}
        <div className="relative z-10">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-gray-500">
              <Loader2 className="animate-spin w-8 h-8 text-cyan-500" />
            </div>
          ) : filteredBlocks.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              No blockchain transactions found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredBlocks.map((block, index) => (
                <motion.div
                  key={block.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-cyan-200/50 
                             shadow-[0_8px_30px_rgba(56,189,248,0.15)] hover:shadow-[0_8px_40px_rgba(56,189,248,0.25)]
                             p-6 transition-all duration-300"
                >
                  {/* 🧩 Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Blocks className="text-cyan-500 w-5 h-5" />
                      <h2 className="font-semibold text-cyan-600">
                        Block #{block.index}
                      </h2>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={14} />{" "}
                      {new Date(block.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* 📦 Block Info */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User size={15} className="text-cyan-500" />
                      <span>
                        <strong>Doctor:</strong>{" "}
                        {block.doctor_name || block.doctor_id || "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <User size={15} className="text-emerald-500" />
                      <span>
                        <strong>Patient:</strong>{" "}
                        {block.patient_name || block.patient_id || "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700">
                      <ShieldCheck size={15} className="text-blue-500" />
                      <span>
                        <strong>Action:</strong> {block.action || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500 break-all">
                      <Hash size={14} className="text-gray-400" />
                      <span className="text-xs">
                        <strong>Hash:</strong> {block.hash}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
