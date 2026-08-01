import { FaGithub } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { motion } from "framer-motion";

export default function ScanHeader({ onHistoryClick }) {
  return (
    <motion.div
      className="scanner-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="scanner-header-left">
        <div className="scanner-header-icon">
          <FaGithub />
        </div>
        <div>
          <h1>GitHub Security Scanner</h1>
          <p>Analyze repositories for vulnerabilities, secrets, and security risks</p>
        </div>
      </div>
      <button className="scanner-history-btn" onClick={onHistoryClick}>
        <FiClock />
        <span>Scan History</span>
      </button>
    </motion.div>
  );
}
