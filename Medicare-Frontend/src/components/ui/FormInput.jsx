// src/components/ui/FormInput.jsx
import React from "react";

const FormInput = ({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  required = false,
  children,
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-800 mb-2 tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        {/* Input field */}
        <input
          id={id}
          name={name || id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="peer w-full box-border bg-white/80 border border-gray-300 rounded-lg py-3 pl-11 pr-4 
                     text-gray-900 placeholder-gray-400 shadow-sm 
                     focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300/50
                     transition-all duration-300"
        />

        {/* Icon */}
        {children && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-blue-600">
            {children}
          </div>
        )}

        {/* Cyan accent underline */}
        <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 peer-focus:w-full" />
      </div>
    </div>
  );
};

export default FormInput;
