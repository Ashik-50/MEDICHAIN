// src/components/ui/PrimaryButton.jsx
import React from "react";
import { motion } from "framer-motion";

const PrimaryButton = ({ children, className = "", loading = false, ...props }) => {
  return (
    <motion.button
      {...props}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading}
      className={`relative inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-lg 
                  font-semibold text-white transition-all duration-300 
                  bg-gradient-to-r from-blue-600 to-cyan-500 
                  shadow-md hover:shadow-lg hover:shadow-cyan-200/50 
                  focus:outline-none border-none disabled:opacity-70 disabled:cursor-not-allowed
                  ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-30"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default PrimaryButton;
