import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLearningRecommendation } from "../../api/aiDashboardApi";
import "./AILearningRecommendation.css";

const RESOURCE_ICON = { OWASP: "🛡️", Quiz: "🧠", Lab: "🔬", Documentation: "📖" };

export default function AILearningRecommendation({ securityData }) {
  const navigate = useNavigate();
  const [learning, setLearning] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const load = useCallback(async () => {
    if (!securityData) return;
    setLoading(true); setError(false);
    try {
      const res = await getLearningRecommendation(securityData);
      setLearning(res.learning);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [securityData]);

  useEffect(() => { load(); }, [load]);

  const primary = learning?.primary;

  return (
    <div className="alr-widget widget-card" aria-label="AI Learning Recommendation">
      <div className="alr-header">
        <div className="alr-title-row">
          <span aria-hidden="true">🎓</span>
          <h3 className="alr-title">Learning Recommendation</h3>
        </div>
        <button className="alr-refresh" onClick={load} aria-label="Refresh recommendation">↻</button>
      </div>

      {loading && <div className="alr-loading" aria-busy="true"><span className="alr-spinner" />Personalising path…</div>}
      {!loading && error && <div className="alr-error">⚠️ <button onClick={load}>Retry</button></div>}

      {!loading && !error && learning && (
        <>
          {learning.skill_gap && (
            <p className="alr-gap">🔍 {learning.skill_gap}</p>
          )}

          {primary && (
            <div className="alr-primary">
              <div className="alr-primary-top">
                <span className="alr-resource-icon" aria-hidden="true">
                  {RESOURCE_ICON[primary.resource] ?? "📚"}
                </span>
                <div>
                  <p className="alr-topic">{primary.topic}</p>
                  <p className="alr-resource">{primary.resource} · {primary.estimated_time}</p>
                </div>
                {learning.xp_reward && (
                  <span className="alr-xp">+{learning.xp_reward} XP</span>
                )}
              </div>
              <p className="alr-reason">{primary.reason}</p>
              <button
                className="alr-start-btn"
                onClick={() => navigate(primary.path ?? "/progress")}
                aria-label={`Start learning ${primary.topic}`}
              >
                Start Learning →
              </button>
            </div>
          )}

          {learning.secondary?.length > 0 && (
            <div className="alr-secondary">
              <p className="alr-secondary-label">Also Recommended</p>
              <ul className="alr-secondary-list">
                {learning.secondary.map((s, i) => (
                  <li
                    key={i}
                    className="alr-secondary-item"
                    onClick={() => navigate(s.path ?? "/progress")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(s.path ?? "/progress")}
                    aria-label={`Go to ${s.topic}`}
                  >
                    <span aria-hidden="true">{RESOURCE_ICON[s.resource] ?? "📚"}</span>
                    <span>{s.topic}</span>
                    <span className="alr-arrow" aria-hidden="true">→</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
