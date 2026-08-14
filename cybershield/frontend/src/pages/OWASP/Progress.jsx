import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Swords,
  Shield,
  CheckCircle2,
  XCircle,
  Trophy,
  Medal,
  Flame,
  Timer,
} from "lucide-react";
import owaspApi from "../../api/owaspApi";

/**
 * Progress page (spec Step 12/17). Shows XP, level, completed labs, badges, and
 * recent practice history.
 */
export default function Progress({ onBack }) {
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const mounted = useRef(true);

  const copyAnswer = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    }
  };

  const load = useCallback(() => {
    Promise.all([owaspApi.progress(), owaspApi.history()])
      .then(([p, h]) => {
        if (!mounted.current) return;
        setProgress(p.data);
        setHistory(h.data || []);
      })
      .catch(() => {
        if (!mounted.current) return;
        setError("Could not load progress. Is the backend running?");
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const labsDone = progress
    ? (progress.completed_attack || []).length + (progress.completed_defense || []).length
    : 0;
  const badges = progress?.badges || [];

  return (
    <div className="cs-ow-wrap">
      <button className="cs-ow-back" onClick={onBack}>
        <ArrowLeft size={15} /> Back
      </button>

      {loading && (
        <div className="cs-ow-loading">
          <span className="cs-ow-spin" /> Loading your progress…
        </div>
      )}

      {error && <div className="cs-ow-alert cs-ow-alert--error">{error}</div>}

      {!loading && !error && progress && (
        <>
          <div className="cs-ow-prog-grid">
            <div className="cs-ow-prog-stat">
              <b>{progress.xp ?? 0}</b>
              <span>Total XP</span>
            </div>
            <div className="cs-ow-prog-stat">
              <b>Lv {progress.level ?? 1}</b>
              <span>Level</span>
            </div>
            <div className="cs-ow-prog-stat">
              <b>{labsDone}</b>
              <span>Labs completed</span>
            </div>
            <div className="cs-ow-prog-stat">
              <b>{badges.length}</b>
              <span>Badges</span>
            </div>
            <div className="cs-ow-prog-stat">
              <b>{progress.streak ?? 0}</b>
              <span>Day streak</span>
            </div>
            <div className="cs-ow-prog-stat">
              <b>{progress.total_attempts ?? 0}</b>
              <span>Total attempts</span>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="cs-ow-panel">
              <h4>
                <Medal size={16} /> Badges
              </h4>
              <div className="cs-ow-badge-row">
                {badges.map((b) => (
                  <span key={b} className="cs-ow-badge-tag">
                    <Medal size={13} /> {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="cs-ow-panel">
            <h4>
              <Swords size={16} /> Completed Attack Labs
            </h4>
            {progress.completed_attack && progress.completed_attack.length > 0 ? (
              <div className="cs-ow-badge-row">
                {progress.completed_attack.map((c) => (
                  <span key={c} className="cs-ow-chip cs-ow-chip--danger">
                    <CheckCircle2 size={12} /> {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="cs-ow-para">No attack labs completed yet.</p>
            )}
          </div>

          <div className="cs-ow-panel">
            <h4>
              <Shield size={16} /> Completed Defense Labs
            </h4>
            {progress.completed_defense && progress.completed_defense.length > 0 ? (
              <div className="cs-ow-badge-row">
                {progress.completed_defense.map((c) => (
                  <span key={c} className="cs-ow-chip cs-ow-chip--success">
                    <CheckCircle2 size={12} /> {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="cs-ow-para">No defense labs completed yet.</p>
            )}
          </div>

          <div className="cs-ow-panel">
            <h4>
              <Flame size={16} /> Recent Practice
            </h4>
            {history.length === 0 ? (
              <p className="cs-ow-para">No attempts yet — launch a lab to get started.</p>
            ) : (
              <ul className="cs-ow-history">
                {history.slice(0, 12).map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="cs-ow-history-row"
                      onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                      aria-expanded={expandedId === h.id}
                    >
                      <div className="cs-ow-history-left">
                        <span className={`cs-ow-history-icon cs-ow-history-icon--${h.mode === "attack" ? "attack" : "defense"}`}>
                          {h.mode === "attack" ? <Swords size={15} /> : <Shield size={15} />}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="cs-ow-history-name">{h.vulnerability}</div>
                          <div className="cs-ow-history-sub">
                            {h.mode} · {h.difficulty}
                            {h.created_at ? ` · ${new Date(h.created_at).toLocaleString()}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="cs-ow-history-right">
                        {h.success ? (
                          <CheckCircle2 size={16} style={{ color: "var(--success, #22c55e)" }} />
                        ) : (
                          <XCircle size={16} style={{ color: "var(--danger, #ef4444)" }} />
                        )}
                        <span className="cs-ow-xp-tag" style={{ padding: "3px 10px", fontSize: "0.74rem" }}>
                          <Timer size={12} /> +{h.xp_earned ?? 0} XP
                        </span>
                      </div>
                    </button>

                    {expandedId === h.id && (
                      <div className="cs-ow-history-detail">
                        <div className="cs-ow-history-detail-head">
                          <span className="cs-ow-chip cs-ow-chip--info">
                            {h.mode === "attack" ? "Your attack payload" : "Your defense code"}
                          </span>
                          {h.payload ? (
                            <button
                              type="button"
                              className="cs-ow-copy-btn"
                              onClick={() => copyAnswer(h.id, h.payload)}
                            >
                              {copiedId === h.id ? "Copied ✓" : "Copy answer"}
                            </button>
                          ) : null}
                        </div>
                        <pre className="cs-ow-history-answer">
                          {h.payload || "(no answer recorded)"}
                        </pre>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}