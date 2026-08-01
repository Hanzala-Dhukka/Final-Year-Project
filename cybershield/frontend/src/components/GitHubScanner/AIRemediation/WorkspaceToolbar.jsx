import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCopy,
  FaDownload,
  FaRobot,
  FaBookOpen,
  FaShareAlt,
  FaCode,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import "./AIRemediation.css";

export default function WorkspaceToolbar({
  fixedCode,
  onAskAI,
  onExplainMore,
  onExport,
  onOpenCodeViewer,
  onShare,
  loading,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyFix = () => {
    if (fixedCode) {
      navigator.clipboard.writeText(fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPatch = () => {
    if (!fixedCode) return;
    const blob = new Blob([fixedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security-fix.patch";
    a.click();
    URL.revokeObjectURL(url);
  };

  const buttons = [
    { label: copied ? "Copied!" : "Copy Fix", icon: copied ? FaCheck : FaCopy, onClick: handleCopyFix, variant: "primary", disabled: !fixedCode || copied },
    { label: "Download Patch", icon: FaDownload, onClick: handleDownloadPatch, variant: "ghost", disabled: !fixedCode },
    { label: loading ? "Generating..." : "Ask AI", icon: loading ? FaSpinner : FaRobot, onClick: onAskAI, variant: "ai", disabled: loading },
    { label: "Explain More", icon: FaBookOpen, onClick: onExplainMore, variant: "ghost" },
    { label: "Export", icon: FaShareAlt, onClick: onExport, variant: "ghost" },
    { label: "Open Viewer", icon: FaCode, onClick: onOpenCodeViewer, variant: "ghost" },
  ];

  return (
    <motion.div
      className="workspace-toolbar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <motion.button
            key={btn.label}
            className={`toolbar-btn ${btn.variant}`}
            onClick={btn.onClick}
            disabled={btn.disabled}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon size={14} className={btn.loading || (btn.label.includes("Generating") ? "spin" : "")} />
            <span>{btn.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}