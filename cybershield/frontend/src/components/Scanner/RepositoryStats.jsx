import { motion } from "framer-motion";
import { FiFile, FiFolder, FiUsers, FiDatabase, FiShield } from "react-icons/fi";

export default function RepositoryStats({ stats = {} }) {
  const items = [
    { icon: <FiFile />, label: "Files", value: stats.files ?? "--", color: "#3b82f6" },
    { icon: <FiFolder />, label: "Directories", value: stats.directories ?? "--", color: "#8b5cf6" },
    { icon: <FiDatabase />, label: "Size", value: stats.size ? `${stats.size} MB` : "--", color: "#06b6d4" },
    { icon: <FiUsers />, label: "Contributors", value: stats.contributors ?? "--", color: "#22c55e" },
    { icon: <FiShield />, label: "Issues", value: stats.open_issues ?? "--", color: "#ef4444" },
  ];

  return (
    <div className="widget-card">
      <div className="widget-header">
        <FiDatabase />
        <h2>Repository Statistics</h2>
      </div>

      <div className="repo-stats-grid">
        {items.map((item) => (
          <div key={item.label} className="repo-stat-item">
            <div className="repo-stat-icon" style={{ color: item.color, background: `${item.color}15` }}>
              {item.icon}
            </div>
            <div className="repo-stat-content">
              <span className="repo-stat-value">{item.value}</span>
              <span className="repo-stat-label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
