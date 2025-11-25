import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, ShieldCheck, Users, Activity } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

export default function PatientDashboard() {
  const { user, token } = useAuth();

  const [doctorCount, setDoctorCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [blockchainStatus, setBlockchainStatus] = useState("Safe & Synced ✅");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const docRes = await api.get(`/connections/doctors?patient_id=${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allDoctors = docRes.data?.doctors || [];
        const connected = allDoctors.filter((d) => d.status === "accepted" || d.status === "connected").length;
        const available = allDoctors.filter((d) => d.status === "none" || d.status === "pending").length;

        setDoctorCount(available);
        setConnectedCount(connected);

        const recRes = await api.get(`/record/count/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecordCount(recRes.data?.record_count || 0);
        setBlockchainStatus("Safe & Synced");
      } catch (err) {
        console.error("Dashboard load error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id && token) fetchDashboardData();
  }, [user?.id, token]);

  const cards = [
    {
      title: "Available Doctors",
      value: doctorCount,
      desc: "Doctors available for consultation.",
      icon: <Users size={26} />,
      gradient: "from-[#63b3ed] to-[#4fd1c5]",
    },
    {
      title: "Connected Doctors",
      value: connectedCount,
      desc: "Active doctors linked to your account.",
      icon: <ShieldCheck size={26} />,
      gradient: "from-[#4fd1c5] to-[#2b6cb0]",
    },
    {
      title: "Stored Records",
      value: recordCount,
      desc: "Your encrypted records stored securely.",
      icon: <FileText size={26} />,
      gradient: "from-[#7f9cf5] to-[#63b3ed]",
    },
    {
      title: "Blockchain Status",
      value: blockchainStatus,
      desc: "System integrity and ledger health.",
      icon: <Activity size={26} />,
      gradient: "from-[#4299e1] to-[#667eea]",
    },
  ];

  return (
    <DashboardLayout role="patient">
      <div className="min-h-screen relative flex flex-col justify-start mt-0">
        {/* 🌫 Arctic Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E0F7FA] via-[#F8FAFF] to-[#E3F2FD]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(173,216,230,0.25),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(173,216,230,0.15),transparent_70%)]" />

        <div className="relative z-10 px-2 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 mt-0">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-cyan-600 to-sky-500 bg-clip-text text-transparent tracking-tight">
              Welcome, {user?.email?.split("@")[0] || "Patient"}
            </h1>
            <p className="mt-4 text-gray-700 text-lg max-w-2xl leading-relaxed">
              A snapshot of your health connections and secure data integrity.
            </p>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <p className="text-gray-500 text-lg animate-pulse">Loading dashboard data...</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {cards.map((card, i) => (
                <div
                  key={i}
                  className="relative rounded-3xl overflow-hidden bg-white/80 backdrop-blur-2xl border border-white/50 
                            shadow-[0_4px_25px_rgba(56,189,248,0.1)] hover:shadow-[0_4px_25px_rgba(56,189,248,0.1)] 
                            transition-all duration-500 p-6 group"
                >
                  <div
                    className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${card.gradient} blur-xl`}
                  ></div>

                  <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                    <div>
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-r ${card.gradient} text-white shadow-[0_0_10px_rgba(56,189,248,0.2)]`}
                      >
                        {card.icon}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800 mb-1">
                        {card.title}
                      </h2>
                      <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500 bg-clip-text text-transparent mb-2">
                        {typeof card.value === "string" ? card.value : card.value || 0}
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
