import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSecurityAnalysis } from "../../api/aiDashboardApi";
import "./AIInsightCard.css";

const STATUS_META = {
  Good:     { cls: "ai-status--good",     icon: "✅" },
  Fair:     { cls: "ai-status--fair",     icon: "⚠️" },
  Poor:     { cls: "ai-status--poor",     icon: "🔴" },
  Critical: { cls: "ai-status--critical", icon: "🚨" },
};

const LEVEL_CLS = {
  Low: "ai-level--low", Medium: "ai-level--medium",
  High: "ai-level--high", Critical: "ai-level--critical",
};

export default function AIInsightCard({ securityData }) {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [cached, setCached]     = useState(false);

  const load = useCallback(async () => {
    if (!securityData) return;
    setLoading(true); setError(false);
    try {
      const res = await getSecurityAnalysis(securityData);
      setAnalysis(res.analysis);
      setCached(res.cached ?? false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [securityData]);

  useEffect(() => { load(); }, [load]);

  const status = analysis?.status ?? "Fair";
  const { cls: statusCls, icon: statusIcon } = STATUS_META[status] ?? STATUS_META.Fair;

  return (
    <div className="aic-widget widget-card" aria-label="AI Security Overview">
      <div className="aic-actions-bar">
        {cached && <span className="aic-cache-badge" title="Served from 24h cache">cached</span>}
        <button className="aic-refresh" onClick={load} aria-label="Refresh AI analysis" title="Refresh">↻</button>
      </div>

      {loading && (
        <div className="aic-loading" aria-busy="true">
          <span className="aic-spinner" aria-hidden="true" />
          Analysing your security posture…
        </div>
      )}

      {!loading && error && (
        <div className="aic-error">
          <p>⚠️ Could not load AI analysis.</p>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && analysis && (
        <>
          <div className={`aic-status ${statusCls}`}>
            <span aria-hidden="true">{statusIcon}</span>
            Your application security is <strong>{status}</strong>.
          </div>

          <div className="aic-summary">{analysis.summary}</div>

          <div className="aic-row">
            <div className="aic-block">
              <p className="aic-block-label">Risk Level</p>
              <span className={`aic-level ${LEVEL_CLS[analysis.risk_level] ?? ""}`}>
                {analysis.risk_level}
              </span>
            </div>
            <div className="aic-block">
              <p className="aic-block-label">Risk Score</p>
              <span className="aic-score">{analysis.risk_score}<sub>/100</sub></span>
            </div>
          </div>

          {analysis.main_concerns?.length > 0 && (
            <div className="aic-section">
              <p className="aic-section-label">Main Concerns</p>
              <ol className="aic-concerns">
                {analysis.main_concerns.map((c, i) => <li key={i}>{c}</li>)}
              </ol>
            </div>
          )}

          {analysis.recommended_actions?.length > 0 && (
            <div className="aic-section">
              <p className="aic-section-label">Recommended Actions</p>
              <ul className="aic-actions">
                {analysis.recommended_actions.map((a, i) => (
                  <li key={i}><span aria-hidden="true">✓</span> {a}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            className="aic-details-btn"
            onClick={() => navigate("/ai-recommendations")}
            aria-label="View full AI recommendations"
          >
            View Full Analysis →
          </button>
        </>
      )}
    </div>
  );
}
