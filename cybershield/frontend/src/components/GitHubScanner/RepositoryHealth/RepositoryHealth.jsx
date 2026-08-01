import { motion } from "framer-motion";
import {
  FaStar,
  FaCodeBranch,
  FaBug,
  FaUsers,
  FaGlobe,
  FaTag,
  FaFileAlt,
  FaDatabase,
  FaServer,
  FaHeart,
  FaCode,
  FaLayerGroup,
  FaNetworkWired,
  FaClock,
  FaPlay,
  FaExchangeAlt,
  FaBox,
  FaExclamationTriangle,
  FaBuilding,
  FaCalendarAlt,
  FaKey,
  FaProjectDiagram,
  FaLock,
} from "react-icons/fa";
import {
  SiDocker,
  SiGithubactions,
  SiMongodb,
  SiExpress,
  SiNginx,
  SiKubernetes,
  SiJenkins,
  SiGitlab,
  SiGooglecloud,
} from "react-icons/si";
import "./RepositoryHealth.css";

const DEVOPS_ICONS = {
  Docker: SiDocker,
  "Docker Compose": SiDocker,
  "GitHub Actions": SiGithubactions,
  MongoDB: SiMongodb,
  Express: SiExpress,
  ExpressJS: SiExpress,
  Nginx: SiNginx,
  Kubernetes: SiKubernetes,
  Jenkins: SiJenkins,
  GitLab: SiGitlab,
  AWS: SiGooglecloud,
  "Google Cloud": SiGooglecloud,
};

function formatNumber(num) {
  if (num == null) return "—";
  if (typeof num === "number") {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toLocaleString();
  }
  return num;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function RepositoryHealth({ repository, technologies, dependency = {}, topics = [] }) {
  if (!repository) return null;

  const {
    name = "Repository",
    owner = "Unknown",
    description = "",
    stars = 0,
    forks = 0,
    issues = 0,
    language = "Unknown",
    visibility = "public",
    license = "No License",
    defaultBranch = "master",
    createdAt = "",
    updatedAt = "",
    lastCommit = "",
  } = repository;

  const tech = technologies || {};

  // ── Health Overview Cards ──
  const healthCards = [
    {
      title: "Stars",
      value: formatNumber(stars),
      icon: <FaStar />,
      iconBg: "#854d0e",
      iconColor: "#fde047",
    },
    {
      title: "Forks",
      value: formatNumber(forks),
      icon: <FaCodeBranch />,
      iconBg: "#1e3a8a",
      iconColor: "#60a5fa",
    },
    {
      title: "Open Issues",
      value: formatNumber(issues),
      icon: <FaBug />,
      iconBg: "#7f1d1d",
      iconColor: "#f87171",
    },
    {
      title: "License",
      value: typeof license === "string" ? (license.split(" ")[0] || "None") : "None",
      icon: <FaFileAlt />,
      iconBg: "#14532d",
      iconColor: "#4ade80",
    },
    {
      title: "Visibility",
      value: String(visibility).charAt(0).toUpperCase() + String(visibility).slice(1),
      icon: <FaGlobe />,
      iconBg: "#581c87",
      iconColor: "#c084fc",
    },
    {
      title: "Default Branch",
      value: defaultBranch,
      icon: <FaCodeBranch />,
      iconBg: "#164e63",
      iconColor: "#22d3ee",
    },
    {
      title: "Language",
      value: language,
      icon: <FaCode />,
      iconBg: "#7c2d12",
      iconColor: "#fb923c",
    },
  ];

  // ── Dependency Health Cards ──
  const depCards = [
    { title: "Total Packages", value: dependency.totalPackages ?? "—", color: "#06b6d4", bg: "#164e63" },
    { title: "Outdated", value: dependency.outdated ?? 0, color: "#f59e0b", bg: "#78350f" },
    { title: "Risky Packages", value: dependency.risky ?? 0, color: "#ef4444", bg: "#7f1d1d" },
    { title: "Unpinned", value: dependency.unpinned ?? 0, color: "#a855f7", bg: "#581c87" },
  ];

  // ── Repository Information Cards ──
  const infoCards = [
    {
      title: "Owner",
      value: owner,
      icon: <FaBuilding />,
      iconBg: "#1e3a8a",
      iconColor: "#60a5fa",
    },
    {
      title: "Default Branch",
      value: defaultBranch,
      icon: <FaCodeBranch />,
      iconBg: "#164e63",
      iconColor: "#22d3ee",
    },
    {
      title: "License",
      value: typeof license === "string" ? (license.split(" ")[0] || "None") : "None",
      icon: <FaFileAlt />,
      iconBg: "#14532d",
      iconColor: "#4ade80",
    },
    {
      title: "Open Issues",
      value: formatNumber(issues),
      icon: <FaBug />,
      iconBg: "#7f1d1d",
      iconColor: "#f87171",
    },
  ];

  // ── Timeline Cards ──
  const timelineItems = [
    { label: "Created", value: formatDate(createdAt), icon: <FaCalendarAlt />, iconClass: "timeline-icon created" },
    { label: "Updated", value: formatDate(updatedAt), icon: <FaPlay />, iconClass: "timeline-icon updated" },
    { label: "Last Commit", value: formatDate(lastCommit), icon: <FaExchangeAlt />, iconClass: "timeline-icon pushed" },
  ];

  // ── Technology Stack Cards ──
  const techStack = [
    { category: "languages", title: "Languages", icon: <FaCode />, className: "language", items: tech.languages || [] },
    { category: "backend", title: "Backend", icon: <FaServer />, className: "backend", items: tech.backend || [] },
    { category: "frontend", title: "Frontend", icon: <FaLayerGroup />, className: "frontend", items: tech.frontend || [] },
    { category: "database", title: "Database", icon: <FaDatabase />, className: "database", items: tech.database || [] },
    { category: "devops", title: "DevOps", icon: <FaNetworkWired />, className: "devops", items: tech.devops || [] },
  ].filter((t) => t.items.length > 0);

  return (
    <div className="repository-health">
      {/* ── Repository Header ── */}
      <section className="health-section repo-header">
        <div className="repo-header-content">
          <div className="repo-header-icon">
            <FaCode size={32} />
          </div>
          <div className="repo-header-text">
            <h2 className="repo-name">{name}</h2>
            {description && <p className="repo-description">{description}</p>}
            <div className="repo-meta">
              <span className="repo-meta-item">
                <FaStar /> {formatNumber(stars)} Stars
              </span>
              <span className="repo-meta-item">
                <FaCodeBranch /> {formatNumber(forks)} Forks
              </span>
              <span className="repo-meta-item">
                <FaCode /> {language}
              </span>
              <span className="repo-meta-item">
                <FaGlobe /> {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Health Overview Grid ── */}
      <section className="health-section">
        <h2 className="health-section-title">
          <FaHeart className="health-section-icon" /> Repository Overview
        </h2>
        <div className="health-grid">
          {healthCards.map((card, index) => (
            <motion.div
              key={card.title}
              className="health-card"
              style={{
                "--icon-bg": card.iconBg,
                "--icon-color": card.iconColor,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <div className="health-icon">{card.icon}</div>
              <div className="health-content">
                <h4 className="health-title">{card.title}</h4>
                <h2 className="health-value">{card.value}</h2>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Repository Information ── */}
      <section className="health-section">
        <h2 className="health-section-title">
          <FaFileAlt className="health-section-icon" /> Repository Information
        </h2>
        <div className="health-grid">
          {infoCards.map((card, index) => (
            <motion.div
              key={card.title}
              className="health-card"
              style={{
                "--icon-bg": card.iconBg,
                "--icon-color": card.iconColor,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
            >
              <div className="health-icon">{card.icon}</div>
              <div className="health-content">
                <h4 className="health-title">{card.title}</h4>
                <h2 className="health-value">{card.value}</h2>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Dates Timeline ── */}
      <section className="health-section timeline-section">
        <h2 className="health-section-title">
          <FaClock className="health-section-icon" /> Dates
        </h2>
        <div className="timeline-grid">
          {timelineItems.map((item, index) => (
            <motion.div
              key={item.label}
              className="timeline-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
            >
              <div className={item.iconClass}>{item.icon}</div>
              <div className="timeline-content">
                <span className="timeline-label">{item.label}</span>
                <span className="timeline-value">{item.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Dependency Health ── */}
      {dependency && (
        <section className="health-section">
          <h2 className="health-section-title">
            <FaBox className="health-section-icon" /> Dependency Health
          </h2>
          <div className="health-grid">
            {depCards.map((dep, index) => (
              <motion.div
                key={dep.title}
                className="health-card"
                style={{
                  "--icon-bg": dep.bg,
                  "--icon-color": dep.color,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
              >
                <div className="health-icon">
                  <FaBox style={{ color: dep.color }} />
                </div>
                <div className="health-content">
                  <h4 className="health-title">{dep.title}</h4>
                  <h2 className="health-value" style={{ color: dep.color }}>{dep.value}</h2>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Technology Stack ── */}
      {techStack.length > 0 && (
        <section className="health-section tech-stack-section">
          <h2 className="health-section-title">
            <FaProjectDiagram className="health-section-icon" /> Technology Stack
          </h2>
          <div className="tech-grid">
            {techStack.map((stack, index) => (
              <motion.div
                key={stack.category}
                className={`tech-card ${stack.className}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
              >
                <div className="tech-card-header">
                  <div className="tech-card-icon">{stack.icon}</div>
                  <h3 className="tech-card-title">{stack.title}</h3>
                </div>
                <div className="tech-chips">
                  {stack.items.map((item) => (
                    <span key={item} className="tech-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Repository Topics ── */}
      {topics && topics.length > 0 && (
        <section className="health-section topics-section">
          <h2 className="health-section-title">
            <FaTag className="health-section-icon" /> Repository Topics
          </h2>
          <div className="topics-container">
            {topics.map((topic) => (
              <span key={topic} className="topic-badge">
                {topic}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default RepositoryHealth;