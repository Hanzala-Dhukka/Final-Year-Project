import { motion } from "framer-motion";
import {
  FaCode,
  FaKey,
  FaBox,
  FaShieldAlt,
  FaBrain,
  FaDocker,
  FaHistory,
  FaCogs,
  FaFileContract,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import "./ScanControl.css";

const MODULES = [
  {
    id: "static",
    title: "Static Analysis (SAST)",
    description: "Source code vulnerability detection",
    icon: FaCode,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
    recommended: true,
  },
  {
    id: "secrets",
    title: "Secret Detection",
    description: "API keys, tokens, passwords",
    icon: FaKey,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    recommended: true,
  },
  {
    id: "deps",
    title: "Dependency Scan (SCA)",
    description: "Vulnerable packages & licenses",
    icon: FaBox,
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.15)",
    recommended: true,
  },
  {
    id: "owasp",
    title: "OWASP Top 10",
    description: "Web app security patterns",
    icon: FaShieldAlt,
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.15)",
  },
  {
    id: "ai",
    title: "AI Code Analysis",
    description: "Smart remediation & context",
    icon: FaBrain,
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.15)",
  },
  {
    id: "docker",
    title: "Docker/Container Scan",
    description: "Image vulnerabilities & config",
    icon: FaDocker,
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.15)",
  },
  {
    id: "git",
    title: "Git History Scan",
    description: "Secrets in commit history",
    icon: FaHistory,
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.15)",
  },
  {
    id: "config",
    title: "Config/IaC Scan",
    description: "Terraform, K8s, CloudFormation",
    icon: FaCogs,
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
  },
  {
    id: "license",
    title: "License Compliance",
    description: "OSS license violations",
    icon: FaFileContract,
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.15)",
  },
];

export default function ScanModules({
  enabledModules,
  onToggleModule,
  selectAll,
  deselectAll,
}) {
  return (
    <div className="modules-section">
      <div className="section-header">
        <h3>Scan Modules</h3>
        <div className="module-actions">
          <button className="module-btn" onClick={selectAll} disabled={enabledModules.every((m) => m.enabled)}>
            <FaCheckCircle size={14} /> All
          </button>
          <button className="module-btn" onClick={deselectAll} disabled={enabledModules.every((m) => !m.enabled)}>
            <FaTimesCircle size={14} /> None
          </button>
        </div>
      </div>
      <div className="module-grid">
        {MODULES.map((module, index) => {
          const Icon = module.icon;
          const isEnabled = enabledModules.some((m) => m.id === module.id && m.enabled);
          return (
            <motion.label
              key={module.id}
              className={`module-card ${isEnabled ? "enabled" : "disabled"}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 + index * 0.04 }}
              whileHover={{ y: -2 }}
            >
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => onToggleModule(module.id)}
                className="module-checkbox"
                aria-label={module.title}
              />
              <div className="module-icon" style={{ backgroundColor: module.bg, color: module.color }}>
                <Icon size={20} />
              </div>
              <div className="module-info">
                <h4 className="module-title">{module.title}</h4>
                <p className="module-description">{module.description}</p>
              </div>
              {module.recommended && (
                <span className="module-badge recommended">Recommended</span>
              )}
            </motion.label>
          );
        })}
      </div>
    </div>
  );
}