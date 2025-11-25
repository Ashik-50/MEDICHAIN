import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ShieldPlus, Mail, Lock, User } from "lucide-react";
import FormInput from "../components/ui/FormInput";
import { useAuth } from "../context/AuthContext";
import PrimaryButton from "../components/ui/PrimaryButton";

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" });
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      await register(form);
      setStatus({ type: "success", message: "Registration successful! Redirecting to login..." });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Registration failed. Try again.";
      setStatus({ type: "error", message: msg });
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E0F2FE] to-[#C7D2FE] px-4">
      {/* Ambient motion gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-cyan-100/40 via-transparent to-blue-100/40"
        animate={{ opacity: [0.4, 0.7, 0.4], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Frosted glass card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md mb-3">
            <ShieldPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-blue-900">Create Account</h2>
          <p className="text-gray-700 text-sm">
            Secure your medical data with MediChain
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {status.message && (
            <div
              className={`text-sm p-2 rounded-md text-center border ${
                status.type === "error"
                  ? "bg-red-100/60 border-red-300/50 text-red-600"
                  : "bg-emerald-100/60 border-emerald-300/50 text-emerald-600"
              }`}
            >
              {status.message}
            </div>
          )}

          <FormInput
            label="Full Name"
            id="name"
            value={form.name}
            onChange={handleChange}
            name="name"
            placeholder="John Doe"
            required
            labelClass="text-gray-800 font-medium"
            focusGlow
          >
            <User className="w-5 h-5 text-blue-600" />
          </FormInput>

          <FormInput
            label="Email"
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            name="email"
            placeholder="you@hospital.com"
            required
            labelClass="text-gray-800 font-medium"
            focusGlow
          >
            <Mail className="w-5 h-5 text-blue-600" />
          </FormInput>

          <FormInput
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            name="password"
            placeholder="●●●●●●●●"
            required
            labelClass="text-gray-800 font-medium"
            focusGlow
          >
            <Lock className="w-5 h-5 text-blue-600" />
          </FormInput>

          <PrimaryButton type="submit" loading={loading}>
            {loading ? "Creating Account..." : "Register"}
          </PrimaryButton>

          <p className="text-center text-gray-700 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-700 hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </form>
      </motion.div>
    </section>
  );
}
