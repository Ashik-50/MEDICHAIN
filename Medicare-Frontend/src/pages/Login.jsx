import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock, Mail } from "lucide-react";
import FormInput from "../components/ui/FormInput";
import PrimaryButton from "../components/ui/PrimaryButton";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email.trim(), password);
    } catch (error) {
      setErr(error?.response?.data?.detail || "Invalid credentials");
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E0F2FE] to-[#C7D2FE] px-4">
      {/* Motion background layer */}
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
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-blue-900">Welcome Back</h2>
          <p className="text-gray-700 text-sm">
            Sign in to access your MediChain account
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {err && (
            <div className="text-sm text-red-600 p-2 rounded-md bg-red-100/60 border border-red-300/50 text-center">
              {err}
            </div>
          )}

          <FormInput
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hospital.com"
            required
            labelClass="text-gray-800 font-medium"
          >
            <Mail className="w-5 h-5 text-blue-600" />
          </FormInput>

          <FormInput
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="●●●●●●●●"
            required
            labelClass="text-gray-800 font-medium"
          >
            <Lock className="w-5 h-5 text-blue-600" />
          </FormInput>

          <div className="flex items-center justify-between text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-blue-500 rounded" /> Remember me
            </label>
            <a href="#" className="text-blue-700 hover:underline">
              Forgot password?
            </a>
          </div>

          <PrimaryButton type="submit" loading={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </PrimaryButton>

          <p className="text-center text-gray-700 text-sm">
            New here?{" "}
            <Link to="/register" className="text-blue-700 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </form>
      </motion.div>
    </section>
  );
}
