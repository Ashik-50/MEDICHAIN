// src/components/AuthCard.jsx
import React from "react";

const AuthCard = ({ title, subtitle, children }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#020617] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.1),transparent_60%)]"></div>

      <div className="relative w-full max-w-md mx-auto p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 1.657-1.343 3-3 3S6 12.657 6 11s1.343-3 3-3 3 1.343 3 3zm0 0c0 1.657 1.343 3 3 3s3-1.343 3-3-1.343-3-3-3-3 1.343-3 3zm-6 8a6 6 0 0112 0" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-wide">{title}</h2>
          <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>

        <div className="space-y-5">{children}</div>
      </div>
    </div>
  );
};

export default AuthCard;
