import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSpinner, FaExclamationTriangle, FaRocket } from "react-icons/fa";
import VulnerabilityHeader from "./VulnerabilityHeader";
import CodeComparison from "./CodeComparison";
import AIExplanation from "./AIExplanation";
import AttackScenario from "./AttackScenario";
import RecommendationPanel from "./RecommendationPanel";
import ReferencePanel from "./ReferencePanel";
import WorkspaceToolbar from "./WorkspaceToolbar";
import "./AIRemediation.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AIRemediationWorkspace() {
  const { scanId, findingId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRemediation = useCallback(async (extra = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/remediation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, findingId, ...extra }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to fetch remediation data");
    } finally {
      setLoading(false);
    }
  }, [scanId, findingId]);

  const handleAskAI = useCallback(() => {
    fetchRemediation({ action: "explain" });
  }, [fetchRemediation]);

  const handleExplainMore = useCallback(() => {
    fetchRemediation({ action: "explain_more" });
  }, [fetchRemediation]);

  const handleExport = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remediation-${findingId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, findingId]);

  const handleOpenCodeViewer = useCallback(() => {
    if (data?.file) {
      navigate(`/code-viewer/${scanId}?file=${encodeURIComponent(data.file)}&line=${data.line || 1}`);
    }
  }, [data, navigate, scanId]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  }, []);

  // Auto-fetch on first load
  if (!data && !loading && !error) {
    fetchRemediation();
    return null;
  }

  const beforeRisk = data?.cvss ? Math.min(data.cvss * 10, 100) : 0;
  const afterRisk = data?.fixedCode ? Math.max(beforeRisk - 70, 5) : beforeRisk;

  return (
    <motion.div
      className="ai-remediation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>

      {/* Loading */}
      {loading && !data && (
        <div className="loading-state">
          <FaSpinner className="spin" size={40} color="#6366f1" />
          <p>Loading AI remediation data...</p>
        </div>
      )}

      {/* Error */}
      {error && !data && (
        <div className="error-state">
          <FaExclamationTriangle size={40} color="#ef4444" />
          <h3>Failed to load remediation</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => fetchRemediation()}>
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          <VulnerabilityHeader finding={data} />

          {/* Risk Meter */}
          <div className="risk-meter-card">
            <div className="risk-meter-row">
              <div className="risk-section">
                <span className="risk-label">Before Fix</span>
                <div className="risk-bar-wrapper">
                  <div className="risk-bar before" style={{ width: `${beforeRisk}%` }}>
                    <span className="risk-value">{beforeRisk}</span>
                  </div>
                </div>
              </div>
              <FaRocket size={20} color="#6366f1" className="risk-arrow" />
              <div className="risk-section">
                <span className="risk-label success">After AI Fix</span>
                <div className="risk-bar-wrapper">
                  <div className="risk-bar after" style={{ width: `${afterRisk}%` }}>
                    <span className="risk-value">{afterRisk}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CodeComparison
            originalCode={data.originalCode}
            fixedCode={data.fixedCode}
            file={data.file}
            line={data.line}
          />

          <AIExplanation explanation={data.explanation} finding={data} />

          <AttackScenario scenario={data.attackScenario} finding={data} />

          <RecommendationPanel recommendations={data.recommendations} />

          <ReferencePanel finding={data} />

          {/* Confidence Meter */}
          {data.confidence && (
            <motion.div
              className="confidence-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="card-title">
                <span>AI Confidence</span>
              </div>
              <div className="confidence-row">
                <div className="confidence-bar-wrapper">
                  <motion.div
                    className="confidence-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.confidence}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="confidence-value">{data.confidence}%</span>
              </div>
              <p className="confidence-note">
                Confidence reflects how well the AI matches the detected vulnerability pattern.
              </p>
            </motion.div>
          )}

          <WorkspaceToolbar
            fixedCode={data.fixedCode}
            onAskAI={handleAskAI}
            onExplainMore={handleExplainMore}
            onExport={handleExport}
            onOpenCodeViewer={handleOpenCodeViewer}
            onShare={handleShare}
            loading={loading}
          />
        </>
      )}
    </motion.div>
  );
}