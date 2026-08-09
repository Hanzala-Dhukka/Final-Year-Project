import { motion } from "framer-motion"
import { FaExclamationTriangle, FaRedo, FaGithub } from "react-icons/fa"

export default function ScanError({ error, onRetry }) {
  return (
    <div className="gs-page">
      <motion.div
        className="gs-empty-state"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ fontSize: 64, color: "#ef4444", marginBottom: 16 }}>
          <FaExclamationTriangle />
        </div>
        <h2 style={{ color: "#ef4444" }}>Scan Failed</h2>
        <p style={{ color: "var(--textSecondary)", marginBottom: 24 }}>
          {error || "An unexpected error occurred during the scan."}
        </p>
        <button className="gs-btn-primary" onClick={onRetry}>
          <FaRedo /> Try Again
        </button>
      </motion.div>
    </div>
  )
}
