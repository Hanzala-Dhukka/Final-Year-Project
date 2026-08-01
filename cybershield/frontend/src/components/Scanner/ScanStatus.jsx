import { FiCheckCircle, FiLoader, FiAlertCircle, FiClock, FiXCircle } from "react-icons/fi";

const statusConfig = {
  queued: { icon: <FiClock />, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Queued" },
  running: { icon: <FiLoader className="spin" />, color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Scanning" },
  completed: { icon: <FiCheckCircle />, color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Completed" },
  failed: { icon: <FiAlertCircle />, color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Failed" },
  cancelled: { icon: <FiXCircle />, color: "#ef4444", bg: "rgba(239,68,68,0.08)", label: "Cancelled" },
};

export default function ScanStatus({ status = "idle", riskScore = 0 }) {
  const config = statusConfig[status] || { icon: null, color: "#64748b", bg: "transparent", label: status };

  return (
    <div className="scan-status" style={{ background: config.bg, borderColor: `${config.color}33` }}>
      <span className="scan-status-icon" style={{ color: config.color }}>{config.icon}</span>
      <span className="scan-status-label" style={{ color: config.color }}>{config.label}</span>
      {status === "completed" && riskScore > 0 && (
        <span className="scan-status-score">Risk: {riskScore}</span>
      )}
    </div>
  );
}
