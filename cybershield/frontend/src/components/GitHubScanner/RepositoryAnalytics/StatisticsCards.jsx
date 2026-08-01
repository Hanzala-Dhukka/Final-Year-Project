import { motion } from "framer-motion";
import {
  FaFileCode,
  FaFolderOpen,
  FaDatabase,
  FaUsers,
  FaGitAlt,
  FaCodeBranch,
  FaStar,
  FaHdd,
  FaBug,
} from "react-icons/fa";
import "./Analytics.css";

const STAT_CONFIG = [
  {
    key: "files",
    title: "Files",
    icon: FaFileCode,
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.15)",
  },
  {
    key: "directories",
    title: "Directories",
    icon: FaFolderOpen,
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.15)",
  },
  {
    key: "size",
    title: "Size",
    icon: FaHdd,
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.15)",
  },
  {
    key: "commits",
    title: "Commits",
    icon: FaGitAlt,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
  },
  {
    key: "branches",
    title: "Branches",
    icon: FaCodeBranch,
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.15)",
  },
  {
    key: "contributors",
    title: "Contributors",
    icon: FaUsers,
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.15)",
  },
  {
    key: "stars",
    title: "Stars",
    icon: FaStar,
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.15)",
  },
  {
    key: "forks",
    title: "Forks",
    icon: FaGitAlt,
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
  },
];

function formatValue(value) {
  if (value == null) return "—";
  if (typeof value === "number") {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "k";
    return value.toLocaleString();
  }
  return value;
}

export default function StatisticsCards({
  files,
  directories,
  size,
  contributors,
  commits,
  branches,
  stars,
  forks,
}) {
  const stats = [
    { ...STAT_CONFIG[0], value: files },
    { ...STAT_CONFIG[1], value: directories },
    { ...STAT_CONFIG[2], value: size },
    { ...STAT_CONFIG[3], value: commits },
    { ...STAT_CONFIG[4], value: branches },
    { ...STAT_CONFIG[5], value: contributors },
    { ...STAT_CONFIG[6], value: stars },
    { ...STAT_CONFIG[7], value: forks },
  ].filter((s) => s.value != null);

  if (stats.length === 0) return null;

  return (
    <motion.div
      className="dashboardCard statistics-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="dashboardCardTitle">Repository Statistics</h3>
      <div className="stats-grid" role="list" aria-label="Repository statistics">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.key}
            className="stat-card"
            role="listitem"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.06 }}
          >
            <div
              className="stat-icon"
              style={{
                backgroundColor: stat.bg,
                color: stat.color,
              }}
            >
              <stat.icon size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatValue(stat.value)}</span>
              <span className="stat-label">{stat.title}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}