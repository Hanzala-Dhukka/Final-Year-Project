import { useState } from "react";
import { motion } from "framer-motion";
import { FiSettings } from "react-icons/fi";

const defaultConfig = {
  secret: true,
  dependency: true,
  owasp: true,
  ai: true,
};

export default function ScanConfiguration({ config, onConfigChange }) {
  const [local, setLocal] = useState(config || defaultConfig);

  const toggle = (key) => {
    setLocal((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      onConfigChange?.(next);
      return next;
    });
  };

  const checks = [
    { key: "secret", label: "Secret Scan", desc: "Detect exposed credentials and API keys" },
    { key: "dependency", label: "Dependency Scan", desc: "Analyze third-party packages for vulnerabilities" },
    { key: "owasp", label: "OWASP Scan", desc: "Check against OWASP Top 10 security risks" },
    { key: "ai", label: "AI Analysis", desc: "AI-powered deep security analysis" },
  ];

  return (
    <motion.div
      className="widget-card scan-config-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="widget-header">
        <FiSettings />
        <h2>Scan Configuration</h2>
      </div>

      <div className="scan-config-list">
        {checks.map((item) => (
          <label key={item.key} className={`scan-config-item ${local[item.key] ? "active" : ""}`}>
            <div className="scan-config-toggle">
              <input
                type="checkbox"
                checked={local[item.key]}
                onChange={() => toggle(item.key)}
              />
              <span className="toggle-slider" />
            </div>
            <div>
              <span className="scan-config-label">{item.label}</span>
              <span className="scan-config-desc">{item.desc}</span>
            </div>
          </label>
        ))}
      </div>
    </motion.div>
  );
}
