import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  Users,
  FileText,
  ShieldCheck,
  Network,
  LogOut,
} from "lucide-react";

const navItems = {
  doctor: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/doctor/dashboard" },
    { label: "Patients", icon: Users, path: "/doctor/patients" },
    { label: "Access", icon: Network, path: "/doctor/access" },
    { label: "Upload Record", icon: Upload, path: "/doctor/upload" },
    { label: "Logs", icon: FileText, path: "/doctor/logs" },
  ],
  patient: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/patient/dashboard" },
    { label: "My Records", icon: FileText, path: "/patient/records" },
    { label: "Find Doctors", icon: Users, path: "/patient/finddoctors" },
    { label: "Access Control", icon: ShieldCheck, path: "/patient/access-control" },
    { label: "Logs", icon: FileText, path: "/patient/logs" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Patients", icon: Users, path: "/admin/manage-patients" },
    { label: "Doctors", icon: Users, path: "/admin/manage-doctors" },
    { label: "Blockchain", icon: Network, path: "/admin/blockchain" },
    { label: "Audit", icon: FileText, path: "/admin/audit" },
  ],
};

export default function DashboardSidebar({ role = "doctor" }) {
  const navigate = useNavigate();
  const items = navItems[role] || [];

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-68 h-screen flex flex-col bg-white/60 backdrop-blur-2xl border-r border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.05)] relative z-20 select-none"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/30">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
          MediChain
        </h1>
        <p className="text-xs text-gray-500 mt-1 tracking-wide capitalize">{role} panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {items.map(({ label, icon: Icon, path }) => (
          <NavLink key={label} to={path} className="no-underline">
            {({ isActive }) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/90 to-cyan-400/90 text-white shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                    : "text-gray-700 hover:bg-white/60 hover:shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all ${
                    isActive ? "text-white" : "text-blue-500"
                  }`}
                />
                <span
                  className={`font-medium text-sm ${
                    isActive ? "text-white" : "text-gray-800"
                  }`}
                >
                  {label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ✅ Refined Logout Button — Borderless, Clean, and Modern */}
      <div className="px-6 pb-6 mt-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="w-full py-3 rounded-xl font-semibold text-white 
                     bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 
                     shadow-[0_4px_20px_rgba(56,189,248,0.25)] 
                     hover:shadow-[0_8px_30px_rgba(56,189,248,0.4)]
                     focus:outline-none border-none outline-none 
                     transition-all duration-300 backdrop-blur-xl 
                     flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}
