// src/components/DoctorLayout.jsx
import React, { useEffect } from "react";
import DashboardSidebar from "./DashboardSidebar";

const DoctorLayout = ({ children }) => {
  useEffect(() => {
    // ✅ Ensure modal-root exists in DOM
    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.id = "modal-root";
      document.body.appendChild(modalRoot);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F7FAFF] text-gray-800 overflow-hidden relative">
      {/* ✅ Fixed Sidebar */}
      <div className="fixed top-0 left-0 h-full z-40">
        <DashboardSidebar role="doctor" />
      </div>

      {/* ✅ Scrollable Main Content */}
      <main className="flex-1 ml-[260px] relative overflow-y-auto z-10">
        {/* 🌈 Background (Arctic Pearl) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECF7FF] via-[#F8FBFF] to-[#E5F1FF]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.15),transparent_70%)] blur-3xl" />

        {/* 🧊 Content Area */}
        <div className="relative z-20 max-w-7xl mx-auto px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DoctorLayout;
