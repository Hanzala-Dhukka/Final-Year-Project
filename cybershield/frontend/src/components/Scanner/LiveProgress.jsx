import { motion } from "framer-motion";
import { FiActivity, FiLoader, FiFile } from "react-icons/fi";

export default function LiveProgress({ progress = 0, stage = "", currentFile = "", active = false }) {
  const pct = Math.min(Math.max(progress, 0), 100);
  const stageLabel = stage || (pct === 0 ? "Waiting to start..." : pct >= 100 ? "Complete!" : "Scanning...");

  return (
    <div className="live-progress">
      <div className="lp-header">
        <div className="lp-header-left">
          {active ? <FiLoader className="spin" /> : <FiActivity />}
          <h2>Live Scan Progress</h2>
        </div>
        <span className="lp-pct">{pct}%</span>
      </div>

      <div className="progress-bar-track">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {pct > 5 && <span className="progress-bar-label">{pct}%</span>}
        </motion.div>
      </div>

      <div className="lp-info">
        <div className="lp-stage">
          {active && pct < 100 && <FiLoader className="spin" />}
          <span>{stageLabel}</span>
        </div>
        {currentFile && (
          <div className="lp-file">
            <FiFile />
            <span>{currentFile}</span>
          </div>
        )}
      </div>

      {/* Stage dots */}
      <div className="scan-stages">
        {["Init", "Fetch", "Scan", "Analyze", "Secrets", "OWASP", "AI", "Report", "Done"].map((s, i) => {
          const stagePct = ((i + 1) / 9) * 100;
          const done = pct >= stagePct;
          const current = pct >= stagePct - 12 && pct < stagePct + 12;
          return (
            <div key={i} className="scan-stage-item" title={s}>
              <div className={`scan-stage-dot ${done ? "done" : ""} ${current ? "current" : ""}`} />
              <span className="scan-stage-label">{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
