import { motion } from "framer-motion";
import { FaCheck, FaSpinner, FaCircle } from "react-icons/fa";
import "./ScanDashboard.css";

const DEFAULT_STAGES = [
  "Initializing",
  "Downloading Repository",
  "Static Analysis",
  "Secret Scanning",
  "Dependency Analysis",
  "OWASP Top 10",
  "Docker Scan",
  "Git History",
  "Configuration Scan",
  "License Compliance",
  "AI Remediation",
  "Generating Report"
];

export default function StageTimeline({ stages, currentStageIndex, currentStage, status }) {
  const stageList = stages || DEFAULT_STAGES;
  const activeIndex = typeof currentStageIndex === "number"
    ? currentStageIndex
    : stageList.findIndex((s) => s.toLowerCase() === (currentStage || "").toLowerCase());

  const isRunning = status === "running";
  const isCompleted = status === "completed";

  return (
    <motion.div
      className="stage-timeline-card"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <h3>Stage Progress</h3>
      <div className="stage-list">
        {stageList.map((label, index) => {
          let state = "pending";
          if (isCompleted || index < activeIndex) {
            state = "complete";
          } else if (index === activeIndex && isRunning) {
            state = "current";
          }

          return (
            <motion.div
              key={label + index}
              className={`stage-item ${state}`}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.02 + index * 0.02 }}
            >
              <div className="stage-marker">
                {state === "complete" && (
                  <motion.div
                    className="stage-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <FaCheck size={12} />
                  </motion.div>
                )}
                {state === "current" && (
                  <div className="stage-icon current">
                    <FaSpinner size={12} className="spin" />
                  </div>
                )}
                {state === "pending" && (
                  <FaCircle size={10} color="#334155" />
                )}
              </div>
              <span className="stage-label">
                {label}{state === "current" ? "..." : ""}
              </span>
              {state === "current" && (
                <motion.div
                  className="current-indicator"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  running
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}