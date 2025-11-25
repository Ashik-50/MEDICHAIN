import React from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import { motion } from "framer-motion";

export default function DashboardLayout({ role, children }) {
  return (
    <div className="relative w-full min-h-screen flex bg-gradient-to-br from-[#F4F8FF] via-[#EAF4FF] to-[#E2EEFF] overflow-hidden">
      {/* 🌌 Background light effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.2),transparent_70%)] blur-3xl pointer-events-none"></div>

      {/* 🧭 Fixed Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-64 z-50">
        <DashboardSidebar role={role} />
      </div>

      {/* 📄 Scrollable Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="ml-64 w-[calc(100%-16rem)] min-h-screen relative z-10 overflow-y-auto overflow-x-hidden px-8 pt-6 pb-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
