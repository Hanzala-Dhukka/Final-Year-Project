import { motion } from "framer-motion";
import {
  FaBolt,
  FaSearch,
  FaKey,
  FaBrain,
  FaCheckCircle,
} from "react-icons/fa";
import "./ScanControl.css";

const PRESETS = [
  {
    id: "quick-scan",
    title: "Quick Scan",
    description: "Fast source analysis",
    time: "~30 sec",
    icon: FaBolt,
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.15)",
    border: "#22c55e",
  },
  {
    id: "full-scan",
    title: "Full Scan",
    description: "Complete security scan",
    time: "3-5 min",
    icon: FaSearch,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
    border: "#3b82f6",
  },
  {
    id: "secrets",
    title: "Secrets Scan",
    description: "Detect exposed keys & tokens",
    time: "~1 min",
    icon: FaKey,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "#f59e0b",
  },
  {
    id: "ai-deep",
    title: "AI Deep Scan",
    description: "AI-powered remediation",
    time: "5-10 min",
    icon: FaBrain,
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.15)",
    border: "#a855f7",
  },
];

export default function ScanPresets({ selectedPreset, onSelectPreset }) {
  return (
    <div className="presets-section">
      <div className="section-header">
        <h3>Scan Presets</h3>
        <span className="section-hint">Choose a preset or customize below</span>
      </div>
      <div className="preset-grid">
        {PRESETS.map((preset, index) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset === preset.id;
          return (
            <motion.button
              key={preset.id}
              className={`preset-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectPreset(preset.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.08 }}
              whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={isSelected}
            >
              <div className="preset-icon" style={{ backgroundColor: preset.bg, color: preset.color }}>
                <Icon size={22} />
                {isSelected && <FaCheckCircle size={18} color={preset.color} />}
              </div>
              <h4 className="preset-title">{preset.title}</h4>
              <p className="preset-description">{preset.description}</p>
              <div className="preset-meta">
                <span className="preset-time">{preset.time}</span>
              </div>
              {isSelected && (
                <div className="selected-indicator" style={{ backgroundColor: preset.border }} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}