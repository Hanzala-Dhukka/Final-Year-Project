import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaShieldAlt, FaGithub } from "react-icons/fa";
import { scannerGetStatus, scannerGetLogs } from "../../../services/scanService";
import ScanStats from "./ScanStats";
import ScanStages from "./ScanStages";
import ScanLogs from "./ScanLogs";
import CurrentFile from "./CurrentFile";
import ProgressBar from "./ProgressBar";
import "./ScanDashboard.css";

const STAGES = [
  "Initializing",
  "Downloading Repository",
  "Technology Detection",
  "Dependency Analysis",
  "Secret Scanning",
  "Static Analysis",
  "Risk Assessment",
  "AI Remediation",
  "Generating Report",
  "Saving Results",
  "Completed",
];

export default function ScanDashboard({ scanId, onScanComplete }) {
  const [scan, setScan] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  /* ── Elapsed Timer ────────────────────────────────────────── */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  /* ── Real Backend Polling ─────────────────────────────────── */
  useEffect(() => {
    if (!scanId) return;

    pollRef.current = setInterval(async () => {
      try {
        const status = await scannerGetStatus(scanId);
        // Map scanner-engine fields to what the dashboard expects
        const data = {
          ...status,
          stage: status.current_stage || status.stage || "Initializing",
          completed: status.status === "completed" || status.status === "failed",
          message: status.current_file || "",
        };

        // Fetch logs separately
        try {
          const logsRes = await scannerGetLogs(scanId);
          data.logs = logsRes.logs || [];
        } catch {
          data.logs = [];
        }

        setScan(data);

        if (data.completed) {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          if (onScanComplete) onScanComplete(data);
        }
      } catch (err) {
        console.log("Progress poll error:", err);
      }
    }, 1500);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, [scanId, onScanComplete]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const currentStageIndex = scan ? STAGES.indexOf(scan.stage) : 0;

  if (!scan) {
    return (
      <div className="enterprise-dashboard">
        <div className="dashboard-header-banner">
          <div className="dashboard-title-box">
            <h2><FaShieldAlt style={{ color: "#00e5ff" }} /> Initializing...</h2>
            <p>Starting scan process</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="enterprise-dashboard"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Banner */}
      <div className="dashboard-header-banner">
        <div className="dashboard-title-box">
          <h2>
            <FaShieldAlt style={{ color: "#00e5ff" }} />
            CyberShield Enterprise Scanner
          </h2>
          <p>Real-time automated repository security analysis</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--textSecondary)", fontSize: "0.85rem" }}>
          <FaGithub />
          <span style={{ color: "var(--textPrimary)", fontWeight: 600 }}>{scan.stage || "Initializing"}</span>
        </div>
      </div>

      {/* Top Stats */}
      <ScanStats
        elapsed={formatTime(elapsed)}
        progress={scan.progress}
        risk="Analyzing"
        files={scan.current_file || "Waiting..."}
      />

      {/* Main Grid: Stages + Live Logs */}
      <div className="dashboard-main-grid">
        <ScanStages stages={STAGES} current={currentStageIndex >= 0 ? currentStageIndex : 0} />
        <ScanLogs logs={scan.logs || []} />
      </div>

      {/* Current File Activity */}
      <CurrentFile file={scan.current_file || "Waiting..."} issue={scan.message} />

      {/* Bottom Progress Bar */}
      <ProgressBar progress={scan.progress} />
    </motion.div>
  );
}