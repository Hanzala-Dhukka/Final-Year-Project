import { useState } from "react";
import { motion } from "framer-motion";
import { FiGithub, FiCheckCircle, FiLoader } from "react-icons/fi";

export default function RepositoryInput({ onValidate, onScanStart, loading }) {
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [scanType, setScanType] = useState("full");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleValidate = async () => {
    if (!repo.trim()) return;
    setValidating(true);
    // Simulate validation — in real use, call backend API
    await new Promise((r) => setTimeout(r, 1200));
    setValidating(false);
    setValidated(true);
    onValidate?.(repo);
  };

  const handleStartScan = () => {
    if (!validated) return;
    onScanStart?.({ repo, branch, scanType });
  };

  return (
    <motion.div
      className="repo-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="repo-input-row">
        <div className="repo-input-wrapper">
          <FiGithub className="repo-input-icon" />
          <input
            type="text"
            placeholder="https://github.com/owner/repository"
            value={repo}
            onChange={(e) => {
              setRepo(e.target.value);
              setValidated(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />
        </div>

        <div className="repo-selects">
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="main">main</option>
            <option value="master">master</option>
            <option value="develop">develop</option>
          </select>

          <select value={scanType} onChange={(e) => setScanType(e.target.value)}>
            <option value="full">Full Scan</option>
            <option value="quick">Quick Scan</option>
            <option value="secrets">Secrets Only</option>
            <option value="dependencies">Dependencies Only</option>
          </select>
        </div>

        <button
          className={`scanner-btn scanner-btn-validate ${validated ? "validated" : ""}`}
          onClick={handleValidate}
          disabled={validating || !repo.trim()}
        >
          {validating ? (
            <FiLoader className="spin" />
          ) : validated ? (
            <FiCheckCircle />
          ) : null}
          <span>
            {validating ? "Validating..." : validated ? "Validated" : "Validate"}
          </span>
        </button>

        <button
          className="scanner-btn scanner-btn-start"
          onClick={handleStartScan}
          disabled={!validated || loading}
        >
          {loading ? (
            <>
              <FiLoader className="spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <span>Start Scan</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
