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
  Award,
  Download,
} from "lucide-react";
import owaspApi from "../../api/owaspApi";
import OWASPCertificate from "../../components/OWASP/OWASPCertificate";

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

  // Certificate state
  const [attackCerts, setAttackCerts] = useState([]);
  const [defenseCerts, setDefenseCerts] = useState([]);
  const [attackEligible, setAttackEligible] = useState(false);
  const [defenseEligible, setDefenseEligible] = useState(false);
  const [attackDone, setAttackDone] = useState([]);
  const [defenseDone, setDefenseDone] = useState([]);
  const [generatingPro, setGeneratingPro] = useState(null);
  const [viewCert, setViewCert] = useState(null);
  const [viewMode, setViewMode] = useState("attack");

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

  const generateProCert = async (mode) => {
    setGeneratingPro(mode);
    try {
      const r = await owaspApi.generateModeProfessionalCert(mode);
      if (mode === "attack") {
        setAttackCerts((prev) => [...prev, r.data.certificate]);
      } else {
        setDefenseCerts((prev) => [...prev, r.data.certificate]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPro(null);
    }
  };

  const viewCertificate = (cert, mode) => {
    setViewCert(cert);
    setViewMode(mode);
  };

  const ALL_VULNS = [
    "SQL Injection", "XSS", "Command Injection", "Path Traversal",
    "Broken Authentication", "CSRF", "SSRF", "IDOR", "File Upload",
    "XXE", "Security Misconfiguration", "Insecure Deserialization",
    "JWT Attacks", "API Security", "Rate Limiting",
  ];

  const load = useCallback(() => {
    Promise.all([
      owaspApi.progress(),
      owaspApi.history(),
      owaspApi.listModeCertificates("attack"),
      owaspApi.listModeCertificates("defense"),
      owaspApi.checkModeCompletion("attack"),
      owaspApi.checkModeCompletion("defense"),
    ])
      .then(([p, h, atkCerts, defCerts, atkElig, defElig]) => {
        if (!mounted.current) return;
        setProgress(p.data);
        setHistory(h.data || []);
        setAttackCerts(atkCerts.data?.certificates || []);
        setDefenseCerts(defCerts.data?.certificates || []);
        setAttackEligible(atkElig.data?.eligible || false);
        setDefenseEligible(defElig.data?.eligible || false);
        setAttackDone(atkElig.data?.completed_categories || []);
        setDefenseDone(defElig.data?.completed_categories || []);
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

          {/* Certificates Section */}
          <div className="cs-ow-panel cs-ow-cert-panel">
            <h4>
              <Award size={16} /> Certificates
            </h4>

            {/* Attack Mode Certificates */}
            <div className="cs-ow-cert-mode-section">
              <div className="cs-ow-cert-mode-header">
                <Swords size={15} />
                <span>Attack Mode</span>
                <span className="cs-ow-chip cs-ow-chip--danger">
                  {attackDone.length}/15 completed
                </span>
              </div>

              <div className="cs-ow-cert-progress-bar">
                <div
                  className="cs-ow-cert-progress-fill cs-ow-cert-progress-fill--attack"
                  style={{ width: `${(attackDone.length / 15) * 100}%` }}
                />
              </div>

              {attackEligible && !attackCerts.find((c) => c.type?.includes("professional")) && (
                <button
                  className="cs-ow-btn cs-ow-btn--certificate"
                  onClick={() => generateProCert("attack")}
                  disabled={generatingPro === "attack"}
                >
                  {generatingPro === "attack" ? (
                    <span className="cs-ow-spin" />
                  ) : (
                    <Award size={15} />
                  )}
                  {generatingPro === "attack" ? "Generating..." : "You are now a Professional Penetration Tester - Get Certificate"}
                </button>
              )}

              {attackCerts.length > 0 && (
                <div className="cs-ow-cert-list">
                  {attackCerts.map((c) => (
                    <button
                      key={c.certificate_id}
                      className="cs-ow-cert-item"
                      onClick={() => viewCertificate(c, "attack")}
                    >
                      <Award size={14} />
                      <span className="cs-ow-cert-item-name">
                        {c.type?.includes("professional")
                          ? "Professional Penetration Tester"
                          : c.vulnerability_type}
                      </span>
                      <Download size={12} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Defense Mode Certificates */}
            <div className="cs-ow-cert-mode-section">
              <div className="cs-ow-cert-mode-header cs-ow-cert-mode-header--defense">
                <Shield size={15} />
                <span>Defense Mode</span>
                <span className="cs-ow-chip cs-ow-chip--success">
                  {defenseDone.length}/15 completed
                </span>
              </div>

              <div className="cs-ow-cert-progress-bar">
                <div
                  className="cs-ow-cert-progress-fill cs-ow-cert-progress-fill--defense"
                  style={{ width: `${(defenseDone.length / 15) * 100}%` }}
                />
              </div>

              {defenseEligible && !defenseCerts.find((c) => c.type?.includes("professional")) && (
                <button
                  className="cs-ow-btn cs-ow-btn--certificate cs-ow-btn--certificate-defense"
                  onClick={() => generateProCert("defense")}
                  disabled={generatingPro === "defense"}
                >
                  {generatingPro === "defense" ? (
                    <span className="cs-ow-spin" />
                  ) : (
                    <Award size={15} />
                  )}
                  {generatingPro === "defense" ? "Generating..." : "You are now a Professional Security Defender - Get Certificate"}
                </button>
              )}

              {defenseCerts.length > 0 && (
                <div className="cs-ow-cert-list">
                  {defenseCerts.map((c) => (
                    <button
                      key={c.certificate_id}
                      className="cs-ow-cert-item cs-ow-cert-item--defense"
                      onClick={() => viewCertificate(c, "defense")}
                    >
                      <Award size={14} />
                      <span className="cs-ow-cert-item-name">
                        {c.type?.includes("professional")
                          ? "Professional Security Defender"
                          : c.vulnerability_type}
                      </span>
                      <Download size={12} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vulnerability completion checklist */}
            <div className="cs-ow-cert-checklist">
              <h5>Vulnerability Completion</h5>
              <div className="cs-ow-cert-checklist-grid">
                {ALL_VULNS.map((v) => {
                  const atkDone = attackDone.includes(v);
                  const defDone = defenseDone.includes(v);
                  return (
                    <div key={v} className="cs-ow-cert-checklist-item">
                      <span className={`cs-ow-cert-check ${atkDone ? "cs-ow-cert-check--done" : ""}`}>
                        {atkDone ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        ATK
                      </span>
                      <span className={`cs-ow-cert-check ${defDone ? "cs-ow-cert-check--done cs-ow-cert-check--defense" : ""}`}>
                        {defDone ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        DEF
                      </span>
                      <span className="cs-ow-cert-checklist-name">{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Certificate modal */}
          {viewCert && (
            <OWASPCertificate
              certificate={viewCert}
              mode={viewMode}
              onClose={() => setViewCert(null)}
            />
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