import { useEffect, useState, useCallback } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { getRiskScore } from "../../api/aiDashboardApi";
import "./AIRiskScore.css";

const LEVEL_COLOR = {
  Low:      { stroke: "#22c55e", text: "#4ade80" },
  Medium:   { stroke: "#eab308", text: "#fde047" },
  High:     { stroke: "#f97316", text: "#fdba74" },
  Critical: { stroke: "#ef4444", text: "#fca5a5" },
};

const BAR_LABELS = { vulnerability_score: "Vulnerabilities", configuration_score: "Configuration", activity_score: "Activity" };

export default function AIRiskScore({ securityData }) {
  const [risk, setRisk]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  const load = useCallback(async () => {
    if (!securityData) return;
    setLoading(true); setError(false);
    try {
      const res = await getRiskScore(securityData);
      setRisk(res.risk);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [securityData]);

  useEffect(() => { load(); }, [load]);

  const level  = risk?.level ?? "Medium";
  const colors = LEVEL_COLOR[level] ?? LEVEL_COLOR.Medium;
  const score  = risk?.score ?? 0;
  const trend  = risk?.trend ?? "stable";
  const trendIcon = trend === "improving" ? "↓" : trend === "worsening" ? "↑" : "→";
  const trendCls  = trend === "improving" ? "ars-trend--good" : trend === "worsening" ? "ars-trend--bad" : "ars-trend--stable";

  return (
    <div className="ars-widget widget-card" aria-label="AI Risk Score">
      <div className="ars-header">
        <div className="ars-title-row">
          <span aria-hidden="true">🎯</span>
          <h3 className="ars-title">AI Risk Score</h3>
        </div>
        <button className="ars-refresh" onClick={load} aria-label="Refresh risk score">↻</button>
      </div>

      {loading && <div className="ars-loading" aria-busy="true"><span className="ars-spinner" />Calculating…</div>}
      {!loading && error && <div className="ars-error">⚠️ <button onClick={load}>Retry</button></div>}

      {!loading && !error && risk && (
        <>
          <div className="ars-gauge-wrap">
            <div className="ars-gauge" aria-label={`Risk score ${score} out of 100`}>
              <CircularProgressbar
                value={score}
                maxValue={100}
                text={`${score}`}
                styles={buildStyles({
                  pathColor: colors.stroke,
                  textColor: colors.text,
                  trailColor: "rgba(255,255,255,.08)",
                  textSize: "22px",
                })}
              />
            </div>
            <div className="ars-gauge-meta">
              <span className="ars-level" style={{ color: colors.text }}>{level} Risk</span>
              <span className={`ars-trend ${trendCls}`}>{trendIcon} {trend}</span>
              {risk.trend_change !== undefined && (
                <span className="ars-change">
                  {risk.trend_change > 0 ? `+${risk.trend_change}` : risk.trend_change} pts
                </span>
              )}
            </div>
          </div>

          {risk.explanation && <p className="ars-explanation">{risk.explanation}</p>}

          {risk.breakdown && (
            <div className="ars-breakdown">
              {Object.entries(risk.breakdown).map(([key, val]) => (
                <div key={key} className="ars-bar-row" aria-label={`${BAR_LABELS[key] ?? key}: ${val}`}>
                  <span className="ars-bar-label">{BAR_LABELS[key] ?? key}</span>
                  <div className="ars-bar-track">
                    <div className="ars-bar-fill" style={{ width: `${Math.min(100, (val / 40) * 100)}%`, background: colors.stroke }} />
                  </div>
                  <span className="ars-bar-val">{val}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
