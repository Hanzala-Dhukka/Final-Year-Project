import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  FaCopy,
  FaCheck,
  FaExpand,
  FaCompress,
  FaCode,
} from "react-icons/fa";
import "./AIRemediation.css";

const DIFF_THEME = {
  ...oneDark,
  'pre[class*="language-"]': { ...oneDark['pre[class*="language-"]'], background: "transparent", margin: 0, padding: "12px 16px", fontSize: "13px" },
  'code[class*="language-"]': { ...oneDark['code[class*="language-"]'], background: "transparent", fontSize: "13px" },
};

function getLanguage(filename) {
  if (!filename) return "javascript";
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    js: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    php: "php", c: "c", cpp: "cpp", cs: "csharp", html: "html",
    css: "css", json: "json", yaml: "yaml", yml: "yaml", sh: "bash",
    dockerfile: "dockerfile", md: "markdown", sql: "sql", xml: "xml",
  };
  return map[ext] || "javascript";
}

export default function CodeComparison({ originalCode, fixedCode, file, line, language }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState("original");

  const lang = language || getLanguage(file);

  const handleCopy = (code, label) => {
    navigator.clipboard.writeText(code || "");
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      className="code-comparison"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Tabs for mobile */}
      <div className="code-tabs">
        <button className={`code-tab ${activeTab === "original" ? "active" : ""}`} onClick={() => setActiveTab("original")}>
          <FaCode size={14} /> Original Code
        </button>
        <button className={`code-tab ${activeTab === "fixed" ? "active" : ""}`} onClick={() => setActiveTab("fixed")}>
          <FaCode size={14} color="#22c55e" /> AI Secure Code
        </button>
      </div>

      <div className={`code-panels ${expanded ? "expanded" : ""}`}>
        {/* Original */}
        <div className={`code-panel original ${activeTab !== "original" ? "mobile-hidden" : ""}`}>
          <div className="code-panel-header">
            <span className="code-panel-label">Original Code</span>
            <div className="code-panel-actions">
              <button className="code-action" onClick={() => handleCopy(originalCode, "original")} title="Copy original code">
                {copied === "original" ? <FaCheck size={13} color="#22c55e" /> : <FaCopy size={13} />}
              </button>
              <button className="code-action" onClick={() => setExpanded(!expanded)} title={expanded ? "Collapse" : "Expand"}>
                {expanded ? <FaCompress size={13} /> : <FaExpand size={13} />}
              </button>
            </div>
          </div>
          <div className="code-content">
            <SyntaxHighlighter
              language={lang}
              style={DIFF_THEME}
              showLineNumbers
              wrapLines
              lineProps={(lineNum) => {
                if (lineNum === line) {
                  return { style: { background: "rgba(220,38,38,0.15)", borderLeft: "3px solid #dc2626", marginLeft: "-3px" } };
                }
                return {};
              }}
            >
              {originalCode || "// No original code available"}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Divider */}
        <div className="code-divider">
          <div className="code-divider-line" />
          <span className="code-divider-icon">→</span>
          <div className="code-divider-line" />
        </div>

        {/* Fixed */}
        <div className={`code-panel fixed ${activeTab !== "fixed" ? "mobile-hidden" : ""}`}>
          <div className="code-panel-header">
            <span className="code-panel-label success">AI Secure Code</span>
            <div className="code-panel-actions">
              <button className="code-action" onClick={() => handleCopy(fixedCode, "fixed")} title="Copy fixed code">
                {copied === "fixed" ? <FaCheck size={13} color="#22c55e" /> : <FaCopy size={13} />}
              </button>
            </div>
          </div>
          <div className="code-content">
            <SyntaxHighlighter
              language={lang}
              style={DIFF_THEME}
              showLineNumbers
              wrapLines
              lineProps={(lineNum) => {
                if (lineNum === line) {
                  return { style: { background: "rgba(34,197,94,0.15)", borderLeft: "3px solid #22c55e", marginLeft: "-3px" } };
                }
                return {};
              }}
            >
              {fixedCode || "// No fix available"}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      {/* Diff Summary */}
      {originalCode && fixedCode && (
        <div className="diff-summary">
          <div className="diff-line removed">
            <span className="diff-marker">-</span>
            <code>{originalCode.split("\n").find((l) => l.trim()) || originalCode.slice(0, 80)}</code>
          </div>
          <div className="diff-line added">
            <span className="diff-marker">+</span>
            <code>{fixedCode.split("\n").find((l) => l.trim()) || fixedCode.slice(0, 80)}</code>
          </div>
        </div>
      )}
    </motion.div>
  );
}