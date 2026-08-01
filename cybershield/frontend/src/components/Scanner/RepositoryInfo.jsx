import { motion } from "framer-motion";
import { FiStar, FiGitBranch, FiCode, FiClock, FiInfo } from "react-icons/fi";

const defaultInfo = {
  name: "repository",
  description: "No repository validated yet",
  stars: "--",
  forks: "--",
  language: "--",
  branch: "main",
  lastCommit: "--",
};

export default function RepositoryInfo({ info }) {
  const data = { ...defaultInfo, ...info };

  const items = [
    { icon: <FiStar />, label: "Stars", value: data.stars, color: "#f59e0b" },
    { icon: <FiGitBranch />, label: "Forks", value: data.forks, color: "#3b82f6" },
    { icon: <FiCode />, label: "Language", value: data.language, color: "#8b5cf6" },
    { icon: <FiGitBranch />, label: "Default Branch", value: data.branch, color: "#22c55e" },
    { icon: <FiClock />, label: "Last Commit", value: data.lastCommit, color: "#06b6d4" },
  ];

  return (
    <motion.div
      className="widget-card repo-info-card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="widget-header">
        <FiInfo />
        <h2>Repository Information</h2>
      </div>

      {info?.name && (
        <div className="repo-info-name">
          <span>{info.name}</span>
          {info.description && <p>{info.description}</p>}
        </div>
      )}

      <div className="repo-info-grid">
        {items.map((item) => (
          <div key={item.label} className="repo-info-item">
            <span className="repo-info-icon" style={{ color: item.color }}>
              {item.icon}
            </span>
            <div>
              <span className="repo-info-label">{item.label}</span>
              <span className="repo-info-value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
