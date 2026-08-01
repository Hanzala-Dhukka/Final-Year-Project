import { motion } from "framer-motion";
import { FiActivity, FiLoader } from "react-icons/fi";

const stages = [
  "Initializing...",
  "Fetching repository...",
  "Scanning files...",
  "Analyzing secrets...",
  "Checking dependencies...",
  "OWASP analysis...",
  "AI review...",
  "Generating report...",
  "Complete!",
];

export default function ScanProgress({ progress = 0, stage = "", active = false }) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const stageLabel = stage || (pct === 0 ? "Waiting to start..." : pct >= 100 ? "Complete!" : "Scanning...");

  return (
    <motion.div
      className="widget-card scan-progress-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="widget-header">
        {active ? <FiLoader className="spin" /> : <FiActivity />}
        <h2>Live Scan Progress</h2>
        <span className="scan-progress-pct">{pct}%</span>
      </div>

      <div className="progress-bar-track">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {pct > 0 && <span className="progress-bar-label">{pct}%</span>}
        </motion.div>
      </div>

      <div className="scan-progress-stage">
        {active && pct < 100 && <FiLoader className="spin" />}
        <span>{stageLabel}</span>
      </div>

      {/* Stage indicators */}
      <div className="scan-stages">
        {stages.slice(0, -1).map((s, i) => {
          const stagePct = ((i + 1) / (stages.length - 1)) * 100;
          const done = pct >= stagePct;
          const current = pct >= stagePct - 12 && pct < stagePct + 12;
          return (
            <div
              key={i}
              className={`scan-stage-dot ${done ? "done" : ""} ${current ? "current" : ""}`}
              title={s}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
