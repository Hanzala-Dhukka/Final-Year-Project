import { motion } from "framer-motion";
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaHourglassHalf,
  FaRocket,
  FaPause,
  FaPlay,
  FaCode,
  FaKey,
  FaBox,
  FaShieldAlt,
  FaDocker,
  FaHistory,
  FaCogs,
  FaFileContract,
  FaBrain,
  FaFileAlt,
} from "react-icons/fa";
import "./ScanControl.css";

const STAGES = [
  { id: "init", label: "Initializing", icon: FaRocket, color: "#6366f1" },
  { id: "download", label: "Downloading Repository", icon: FaSpinner, color: "#3b82f6" },
  { id: "static", label: "Static Analysis", icon: FaCode, color: "#22c55e" },
  { id: "secrets", label: "Secret Scanning", icon: FaKey, color: "#f59e0b" },
  { id: "deps", label: "Dependency Analysis", icon: FaBox, color: "#06b6d4" },
  { id: "owasp", label: "OWASP Top 10 Check", icon: FaShieldAlt, color: "#ef4444" },
  { id: "docker", label: "Docker Scan", icon: FaDocker, color: "#06b6d4" },
  { id: "git", label: "Git History Analysis", icon: FaHistory, color: "#8b5cf6" },
  { id: "config", label: "Configuration Scan", icon: FaCogs, color: "#ec4899" },
  { id: "license", label: "License Compliance", icon: FaFileContract, color: "#64748b" },
  { id: "ai", label: "AI Remediation", icon: FaBrain, color: "#a855f7" },
  { id: "report", label: "Generating Report", icon: FaFileAlt, color: "#6366f1" },
];

export default function ScanProgress({
  progress = 0,
  stage = "init",
  status = "idle", // idle, running, paused, completed, failed, cancelled
  eta,
  queuePosition,
  startTime,
  totalModules,
  completedModules,
}) {
  const currentStage = STAGES.find((s) => s.id === stage) || STAGES[0];
  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const completedStages = stageIndex >= 0 ? stageIndex : 0;
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const isCancelled = status === "cancelled";
  const isPaused = status === "paused";

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getElapsed = () => {
    if (!startTime) return "00:00";
    return formatTime(Math.floor((Date.now() - startTime) / 1000));
  };

  return (
    <motion.div
      className={`progress-section ${status}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="progress-header">
        <h3>Scan Progress</h3>
        <motion.span
          className="progress-percent"
          style={{ color: currentStage.color }}
          animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
        >
          {progress}%
        </motion.span>
      </div>

      <div className="progress-bar-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Scan progress">
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ backgroundColor: currentStage.color }}
        >
          {isRunning && (
            <motion.div
              className="progress-shimmer"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      </div>

      <div className="progress-info">
        <div className="progress-stage">
          <motion.div
            className={`stage-indicator ${isRunning ? "pulse" : ""}`}
            style={{ backgroundColor: currentStage.color }}
            whileHover={{ scale: 1.1 }}
          >
            {isRunning ? (
              <FaSpinner className="spin" size={14} color="#fff" />
            ) : isCompleted ? (
              <FaCheckCircle size={14} color="#fff" />
            ) : isFailed ? (
              <FaExclamationTriangle size={14} color="#fff" />
            ) : isPaused ? (
              <FaPause size={14} color="#fff" />
            ) : (
              <FaClock size={14} color="#fff" />
            )}
          </motion.div>
          <div className="stage-text">
            <span className="stage-label">Current Stage:</span>
            <span className="stage-name">{currentStage.label}</span>
          </div>
        </div>

        <div className="progress-meta">
          <div className="meta-item">
            <FaClock size={14} color="#94a3b8" />
            <span>
              <strong>Elapsed:</strong> {getElapsed()}
            </span>
          </div>
          {eta && (
            <div className="meta-item">
              <FaHourglassHalf size={14} color="#94a3b8" />
              <span>
                <strong>ETA:</strong> {formatTime(eta)}
              </span>
            </div>
          )}
          {queuePosition !== undefined && queuePosition > 0 && (
            <div className="meta-item">
              <FaHourglassHalf size={14} color="#94a3b8" />
              <span>
                <strong>Queue:</strong> #{queuePosition}
              </span>
            </div>
          )}
        </div>

        {/* Module Progress */}
        {(totalModules && completedModules !== undefined) && (
          <div className="module-progress">
            <span className="module-progress-label">
              {completedModules}/{totalModules} modules completed
            </span>
            <div className="module-progress-bar">
              <motion.div
                className="module-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(completedModules / totalModules) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Stage Pipeline */}
        <div className="stage-pipeline" aria-label="Scan stages">
          {STAGES.map((s, i) => {
            const isComplete = i < completedStages;
            const isCurrent = i === stageIndex && isRunning;
            const isPending = i > completedStages;
            return (
              <motion.div
                key={s.id}
                className={`pipeline-stage ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""} ${isPending ? "pending" : ""}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <div className="stage-dot" style={{ backgroundColor: isComplete || isCurrent ? s.color : "#334155" }} />
                {!isPending && i < STAGES.length - 1 && (
                  <div className="stage-connector" style={{ backgroundColor: isComplete ? s.color : "#334155" }} />
                )}
                <div className="stage-label">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}