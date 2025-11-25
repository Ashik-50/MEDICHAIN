import { motion } from "framer-motion";
import { ShieldCheck, UserMinus, UserPlus } from "lucide-react";

export default function AccessControlCard({ doctor, granted, onToggle }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow hover:shadow-lg transition flex justify-between items-center"
    >
      <div>
        <h3 className="font-semibold">{doctor.name}</h3>
        <p className="text-sm text-gray-500">{doctor.hospital}</p>
      </div>
      <button
        onClick={() => onToggle(doctor.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          granted
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        } text-white transition`}
      >
        {granted ? <UserMinus size={16} /> : <UserPlus size={16} />}
        {granted ? "Revoke" : "Grant"}
      </button>
    </motion.div>
  );
}
