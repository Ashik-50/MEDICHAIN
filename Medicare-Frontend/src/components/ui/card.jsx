// src/components/ui/card.jsx
import React from "react";

export const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white/70 backdrop-blur-md rounded-2xl shadow-md border border-slate-200 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 bg-white/50">
    {Icon && <Icon className="text-blue-500 w-5 h-5" />}
    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
  </div>
);

export const CardContent = ({ children }) => (
  <div className="p-5">{children}</div>
);
