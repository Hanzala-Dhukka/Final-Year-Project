import { useEffect, useState, useCallback } from "react";
import { getRecommendations } from "../../api/aiDashboardApi";
import "./AIRecommendations.css";

const TIERS = [
  { key: "immediate",  label: "⚡ Immediate",  cls: "tier--red"    },
  { key: "short_term", label: "📅 Short-term", cls: "tier--orange" },
  { key: "long_term",  label: "🗓️ Long-term",  cls: "tier--blue"   },
];

const EFFORT_CLS = { Low: "ef--low", Medium: "ef--med", High: "ef--high" };
const IMPACT_CLS = { Low: "im--low", Medium: "im--med", High: "im--high" };

function RecommendationItem({ item }) {
  return (
    <li className="air-item">
      <span className="air-check" aria-hidden="true">✓</span>
      <div className="air-item-body">
        <p className="air-action">{item.action}</p>
        {item.reason && <p className="air-reason">{item.reason}</p>}
        <div className="air-badges">
          {item.effort && <span className={`air-badge ${EFFORT_CLS[item.effort] ?? ""}`}>Effort: {item.effort}</span>}
          {item.impact && <span className={`air-badge ${IMPACT_CLS[item.impact] ?? ""}`}>Impact: {item.impact}</span>}
        </div>
      </div>
    </li>
  );
}

export default function AIRecommendations({ securityData }) {
  const [recs, setRecs]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [activeTab, setTab]   = useState("immediate");

  const load = useCallback(async () => {
    if (!securityData) return;
    setLoading(true); setError(false);
    try {
      const res = await getRecommendations(securityData);
      setRecs(res.recommendations);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [securityData]);

  useEffect(() => { load(); }, [load]);

  const items = recs?.[activeTab] ?? [];

  return (
    <div className="air-widget widget-card" aria-label="AI Recommendations">
      <div className="air-header">
        <div className="air-title-row">
          <span aria-hidden="true">💡</span>
          <h3 className="air-title">AI Recommendations</h3>
        </div>
        <button className="air-refresh" onClick={load} aria-label="Refresh recommendations">↻</button>
      </div>

      {loading && <div className="air-loading" aria-busy="true"><span className="air-spinner" />Loading…</div>}
      {!loading && error && <div className="air-error">⚠️ <button onClick={load}>Retry</button></div>}

      {!loading && !error && recs && (
        <>
          <div className="air-tabs" role="tablist">
            {TIERS.map(({ key, label, cls }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                className={`air-tab ${cls} ${activeTab === key ? "air-tab--active" : ""}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="air-list" role="tabpanel">
            {items.length === 0
              ? <li className="air-empty">No recommendations for this tier.</li>
              : items.map((item, i) => <RecommendationItem key={i} item={item} />)
            }
          </ul>
        </>
      )}
    </div>
  );
}
