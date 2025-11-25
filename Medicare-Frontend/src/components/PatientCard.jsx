import React from "react";
import { motion } from "framer-motion";
import { User, Mail, CheckCircle2, XCircle } from "lucide-react";

export default function PatientCard({ patient, isRequest, onView, onRespond }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-[#0B1A42]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-lg shadow-md hover:shadow-cyan-500/20 transition-all duration-300"
    >
      {/* Patient Info */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xl font-semibold shadow-lg">
          {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
          {patient.email && (
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <Mail size={14} /> {patient.email}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {patient.description && (
        <p className="text-gray-400 text-sm mt-4 line-clamp-2">
          {patient.description}
        </p>
      )}

      {/* Buttons Section */}
      <div className="flex justify-between items-center mt-5">
        {/* View Button */}
        <button
          onClick={onView}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-sm 
                     hover:shadow-lg hover:shadow-cyan-400/30 transition-all duration-300"
        >
          View
        </button>

        {/* Request Action Buttons */}
        {isRequest && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                onRespond && onRespond(patient.id, "accept")
              }
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-600/80 hover:bg-green-500 text-white text-sm transition-all duration-300"
            >
              <CheckCircle2 size={16} /> Accept
            </button>
            <button
              onClick={() =>
                onRespond && onRespond(patient.id, "reject")
              }
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-sm transition-all duration-300"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
