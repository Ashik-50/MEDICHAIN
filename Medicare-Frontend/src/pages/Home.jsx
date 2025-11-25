import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center min-h-screen overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E0F2FE] to-[#C7D2FE] text-gray-800">
      
      {/* Soft background light flow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-cyan-100/40 via-transparent to-blue-100/30"
        animate={{ opacity: [0.4, 0.7, 0.4], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle center light focus */}
      <div className="absolute w-[800px] h-[800px] bg-gradient-radial from-blue-200/30 via-transparent to-transparent blur-[200px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 px-10 py-14 max-w-3xl bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_8px_50px_rgba(0,0,0,0.08)]"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-6xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-4"
        >
          MediChain
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "120px" }}
          transition={{ duration: 1 }}
          className="mx-auto h-[3px] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full mb-8"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-700 text-lg md:text-xl leading-relaxed mb-10"
        >
          A <span className="font-semibold text-blue-600">trusted digital platform</span> for managing{" "}
          <span className="font-semibold text-cyan-600">EMR securely</span> -  
          powered by <span className="font-semibold text-blue-700">encryption</span> and{" "}
          <span className="font-semibold text-blue-700">blockchain integrity</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <Link
            to="/login"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all duration-300"
          >
            Get Started
          </Link>
          <Link
            to="/register"
            className="px-8 py-3 border border-blue-600 text-blue-700 hover:bg-blue-50 rounded-xl font-semibold transition-all duration-300"
          >
            Register
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 text-gray-500 text-sm z-10"
      >
        Professional Blockchain Healthcare Platform | Privacy • Trust • Innovation
      </motion.div>
    </section>
  );
}
