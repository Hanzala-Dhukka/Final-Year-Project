import { motion } from "framer-motion";
import { FiZap, FiShield, FiLock, FiPackage, FiKey } from "react-icons/fi";

const templates = [
  { name: "Quick Scan", desc: "Fast scan for common issues", icon: <FiZap />, color: "#3b82f6" },
  { name: "Full Security Audit", desc: "Comprehensive security analysis", icon: <FiShield />, color: "#8b5cf6" },
  { name: "OWASP Top 10", desc: "Focus on OWASP vulnerabilities", icon: <FiShield />, color: "#f59e0b" },
  { name: "Dependency Only", desc: "Scan third-party packages", icon: <FiPackage />, color: "#22c55e" },
  { name: "Secret Detection", desc: "Find exposed credentials", icon: <FiKey />, color: "#ef4444" },
];

export default function ScanTemplates({ onTemplateSelect }) {
  return (
    <motion.div
      className="widget-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="widget-header">
        <FiZap />
        <h2>Quick Templates</h2>
      </div>

      <div className="templates-grid">
        {templates.map((t, i) => (
          <motion.button
            key={i}
            className="template-card"
            onClick={() => onTemplateSelect?.(t)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="template-icon" style={{ color: t.color, background: `${t.color}18` }}>
              {t.icon}
            </span>
            <div className="template-info">
              <span className="template-name">{t.name}</span>
              <span className="template-desc">{t.desc}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
