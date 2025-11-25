import { motion } from "framer-motion";
import { Link as ChainLink } from "lucide-react";

export default function BlockchainViewer({ chain }) {
  return (
    <div className="flex flex-wrap gap-6 mt-10">
      {chain.map((block, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow relative"
        >
          <div className="absolute -right-5 top-1/2 -translate-y-1/2">
            {index < chain.length - 1 && <ChainLink className="text-gray-400" />}
          </div>
          <h4 className="text-lg font-semibold mb-1">Block #{index + 1}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
            Hash: {block.hash}
          </p>
          <p className="text-xs text-gray-400 break-all">
            Prev: {block.prevHash}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
