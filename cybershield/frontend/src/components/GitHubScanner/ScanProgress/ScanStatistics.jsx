import { motion } from "framer-motion";
import { FaFileCode, FaFolder, FaShieldAlt, FaBug, FaKey, FaCubes } from "react-icons/fa";
import "./ScanDashboard.css";

const STAT_ITEMS = [
  { key: "filesScanned", label: "Files Scanned", icon: FaFileCode, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { key: "directories", label: "Directories", icon: FaFolder, color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  { key: "rulesExecuted", label: "Rules Executed", icon: FaShieldAlt, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  { key: "findings", label: "Findings", icon: FaBug, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  { key: "secretsFound", label: "Secrets Found", icon: FaKey, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { key: "dependenciesChecked", label: "Dependencies", icon: FaCubes, color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
];

export default function ScanStatistics({ stats = {}, totalFiles }) {
  const items = STAT_ITEMS.map((item) => ({
    ...item,
    value: stats[item.key] ?? 0,
  }));

  if (totalFiles) {
    const filesItem = items.find((i) => i.key === "filesScanned");
    if (filesItem) filesItem.max = totalFiles;
  }

  return (
    <motion.div
      className="scan-stats-card"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <h3>Scan Statistics</h3>
      <div className="stats-grid">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              className="stat-box"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
            >
              <div className="stat-box-icon" style={{ backgroundColor: item.bg, color: item.color }}>
                <Icon size={18} />
              </div>
              <div className="stat-box-info">
                <span className="stat-box-value">{item.value.toLocaleString()}</span>
                <span className="stat-box-label">{item.label}</span>
              </div>
              {item.max && (
                <div className="stat-box-bar">
                  <div
                    className="stat-box-bar-fill"
                    style={{
                      width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}