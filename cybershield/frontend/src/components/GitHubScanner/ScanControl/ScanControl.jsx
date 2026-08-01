import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaUndo,
  FaDownload,
  FaShareAlt,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaExternalLinkAlt as FaLink,
  FaTerminal,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import ScanPresets from "./ScanPresets";
import ScanModules from "./ScanModules";
import ScanProgress from "./ScanProgress";
import "./ScanControl.css";

const MODULES = [
  { id: "static", title: "Static Analysis (SAST)", description: "Source code vulnerability detection", icon: "code", color: "#3b82f6", recommended: true },
  { id: "secrets", title: "Secret Detection", description: "API keys, tokens, passwords", icon: "key", color: "#f59e0b", recommended: true },
  { id: "deps", title: "Dependency Scan (SCA)", description: "Vulnerable packages & licenses", icon: "package", color: "#22c55e", recommended: true },
  { id: "owasp", title: "OWASP Top 10", description: "Web app security patterns", icon: "shield", color: "#8b5cf6" },
  { id: "ai", title: "AI Code Analysis", description: "Smart remediation & context", icon: "brain", color: "#a855f7" },
  { id: "docker", title: "Docker/Container Scan", description: "Image vulnerabilities & config", icon: "docker", color: "#06b6d4" },
  { id: "git", title: "Git History Scan", description: "Secrets in commit history", icon: "history", color: "#ec4899" },
  { id: "config", title: "Config/IaC Scan", description: "Terraform, K8s, CloudFormation", icon: "cogs", color: "#ef4444" },
  { id: "license", title: "License Compliance", description: "OSS license violations", icon: "file-contract", color: "#64748b" },
];

const PRESET_MODULES = {
  "full-scan": ["static", "secrets", "deps", "owasp", "docker", "git", "config", "license", "ai"],
  "quick-scan": ["static", "secrets", "deps"],
  "secrets": ["secrets", "git"],
  "ai-deep": ["static", "secrets", "deps", "owasp", "ai"],
};

export default function ScanControl({
  repositoryUrl,
  onScanStart,
  onScanPause,
  onScanResume,
  onScanCancel,
  onScanRetry,
  onExportResults,
  onShareResults,
  onOpenReport,
  scanStatus = "idle",
  scanProgress = 0,
  scanStage = "init",
  scanEta,
  scanQueuePosition,
  scanStartTime,
  initialEnabledModules,
  initialSelectedPreset = "full-scan",
}) {
  const [selectedPreset, setSelectedPreset] = useState(initialSelectedPreset);
  const [enabledModules, setEnabledModules] = useState(
    initialEnabledModules ||
      PRESET_MODULES["full-scan"].map((id) => ({ id, enabled: true }))
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync enabled modules with preset
  useEffect(() => {
    const presetModules = PRESET_MODULES[selectedPreset] || PRESET_MODULES["full-scan"];
    setEnabledModules(presetModules.map((id) => ({ id, enabled: true })));
  }, [selectedPreset]);

  const toggleModule = useCallback((moduleId) => {
    setEnabledModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, enabled: !m.enabled } : m
      )
    );
  }, []);

  const selectAllModules = useCallback(() => {
    setEnabledModules((prev) => prev.map((m) => ({ ...m, enabled: true })));
  }, []);

  const deselectAllModules = useCallback(() => {
    setEnabledModules((prev) => prev.map((m) => ({ ...m, enabled: false })));
  }, []);

  const handleStartScan = useCallback(() => {
    const activeModules = enabledModules.filter((m) => m.enabled).map((m) => m.id);
    if (activeModules.length === 0) return;
    onScanStart({
      preset: selectedPreset,
      modules: activeModules,
      repositoryUrl,
    });
  }, [enabledModules, selectedPreset, repositoryUrl, onScanStart]);

  const getStatusConfig = () => {
    switch (scanStatus) {
      case "running":
        return {
          label: "Scanning...",
          icon: <FaPause size={20} />,
          className: "running",
          action: onScanPause,
          tooltip: "Pause scan",
        };
      case "paused":
        return {
          label: "Paused",
          icon: <FaPlay size={20} />,
          className: "paused",
          action: onScanResume,
          tooltip: "Resume scan",
        };
      case "completed":
        return {
          label: "Completed",
          icon: <FaCheckCircle size={20} color="#22c55e" />,
          className: "completed",
          action: onScanRetry,
          tooltip: "Re-scan",
        };
      case "failed":
        return {
          label: "Failed",
          icon: <FaTimesCircle size={20} color="#ef4444" />,
          className: "failed",
          action: onScanRetry,
          tooltip: "Retry scan",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          icon: <FaStop size={20} color="#ef4444" />,
          className: "cancelled",
          action: onScanRetry,
          tooltip: "Retry scan",
        };
      default:
        return {
          label: "Start Scan",
          icon: <FaPlay size={20} />,
          className: "idle",
          action: handleStartScan,
          tooltip: "Start scan",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isActive = ["running", "paused"].includes(scanStatus);
  const isTerminal = ["completed", "failed", "cancelled"].includes(scanStatus);

  return (
    <motion.div
      className="scan-control"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="scan-control-header">
        <div className="repo-info">
          <FaLink size={16} color="#6366f1" />
          <span className="repo-url" title={repositoryUrl}>
            {repositoryUrl || "No repository selected"}
          </span>
          {scanStatus === "running" && (
            <span className="live-badge">LIVE</span>
          )}
        </div>
        <div className="header-actions">
          <button
            className="action-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title={showAdvanced ? "Hide advanced options" : "Show advanced options"}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
          </button>
          {isTerminal && (
            <>
              <button
                className="action-btn"
                onClick={onExportResults}
                disabled={scanStatus !== "completed"}
                title="Export results"
              >
                <FaSave size={16} />
              </button>
              <button
                className="action-btn"
                onClick={onShareResults}
                disabled={scanStatus !== "completed"}
                title="Share results"
              >
                <FaShareAlt size={16} />
              </button>
              <button
                className="action-btn"
                onClick={onOpenReport}
                disabled={scanStatus !== "completed"}
                title="Open full report"
              >
                <FaExternalLinkAlt size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Action Button */}
      <motion.button
        className={`scan-action-btn ${statusConfig.className}`}
        onClick={statusConfig.action}
        disabled={scanStatus === "running" && !onScanPause}
        title={statusConfig.tooltip}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="action-icon">{statusConfig.icon}</span>
        <span className="action-label">{statusConfig.label}</span>
      </motion.button>

      {/* Advanced Options */}
      <motion.div
        className="advanced-section"
        initial={false}
        animate={{ opacity: showAdvanced ? 1 : 0, height: showAdvanced ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <ScanPresets
          selectedPreset={selectedPreset}
          onSelectPreset={setSelectedPreset}
        />
        <ScanModules
          enabledModules={enabledModules}
          onToggleModule={toggleModule}
          selectAll={selectAllModules}
          deselectAll={deselectAllModules}
        />
      </motion.div>

      {/* Progress */}
      <ScanProgress
        progress={scanProgress}
        stage={scanStage}
        status={scanStatus}
        eta={scanEta}
        queuePosition={scanQueuePosition}
        startTime={scanStartTime}
      />

      {/* Terminal Actions */}
      {isTerminal && (
        <motion.div
          className="terminal-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <button
            className="terminal-btn"
            onClick={onExportResults}
            disabled={scanStatus !== "completed"}
          >
            <FaDownload size={16} />
            Export Report
          </button>
          <button
            className="terminal-btn"
            onClick={onShareResults}
            disabled={scanStatus !== "completed"}
          >
            <FaShareAlt size={16} />
            Share
          </button>
          <button
            className="terminal-btn primary"
            onClick={onOpenReport}
            disabled={scanStatus !== "completed"}
          >
            <FaExternalLinkAlt size={16} />
            View Full Report
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}