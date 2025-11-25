import { motion } from "framer-motion";
import { FileText, Lock, Eye } from "lucide-react";

export default function RecordCard({ record }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow hover:shadow-lg transition"
    >
      <div className="flex items-center justify-between mb-3">
        <FileText size={22} className="text-blue-500" />
        <Lock size={18} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold">{record.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {record.date}
      </p>
      <button className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
        <Eye size={15} /> View (Decrypted)
      </button>
    </motion.div>
  );
}
