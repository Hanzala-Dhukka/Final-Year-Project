import { useEffect, useState, useCallback } from "react";
import { getTrendAnalysis } from "../../api/aiDashboardApi";
import "./AITrendAnalysis.css";

const DIR_META = {
  down:   { icon: "↓", cls: "dir--good"   },
  up:     { icon: "↑", cls: "dir--bad"    },
  stable: { icon: "→", cls: "dir--stable" },
};

const TREND_CLS = {
  improving: "ata-trend--good",
  worsening: "ata-trend--bad",
  stable:    "ata-trend--stable",
};

export default function AITrendAnalysis({ securityData }) {
  const [trend, setTrend]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = useCallback(async () => {
    if (!securityData) return;
    setLoading(true); setError(false);
    try {
      const res = await getTrendAnalysis(securityData);
      setTrend(res.trend);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [securityData]);

  useEffect(() => { load(); }, [load]);

  const overallCls = TREND_CLS[trend?.overall_trend] ?? "ata-trend--stable";

  return (
    <div className="ata-widget widget-card" aria-label="AI Trend Analysis">
      <div className="ata-header">
        <div className="ata-title-row">
          <span aria-hidden="true">📈</span>
          <h3 className="ata-title">AI Trend Analysis</h3>
        </div>
        <button className="ata-refresh" onClick={load} aria-label="Refresh trend">↻</button>
      </div>

      {loading && <div className="ata-loading" aria-busy="true"><span className="ata-spinner" />Analysing trends…</div>}
      {!loading && error && <div className="ata-error">⚠️ <button onClick={load}>Retry</button></div>}

      {!loading && !error && trend && (
        <>
          <div className={`ata-overall ${overallCls}`}>
            {trend.overall_trend === "improving" ? "↓" : trend.overall_trend === "worsening" ? "↑" : "→"}
            <span>Overall: <strong>{trend.overall_trend}</strong></span>
          </div>

          {trend.summary && <p className="ata-summary">{trend.summary}</p>}

          {trend.highlights?.length > 0 && (
            <ul className="ata-highlights" aria-label="Trend highlights">
              {trend.highlights.map((h, i) => {
                const { icon, cls } = DIR_META[h.direction] ?? DIR_META.stable;
                return (
                  <li key={i} className="ata-highlight">
                    <span className={`ata-dir ${cls}`} aria-hidden="true">{icon}</span>
                    <span className="ata-metric">{h.metric}</span>
                    <span className="ata-change">{h.change}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {trend.forecast && (
            <div className="ata-forecast">
              <span className="ata-forecast-label">Forecast</span>
              <p>{trend.forecast}</p>
            </div>
          )}

          {trend.recommendation && (
            <div className="ata-rec">
              <span aria-hidden="true">💡</span>
              {trend.recommendation}
            </div>
          )}
        </>
      )}
    </div>
  );
}
