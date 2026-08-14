import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  Sun,
  Moon,
  Clock,
  History,
  ChevronDown,
  ChevronRight,
  FileCode2,
  RotateCcw,
  Link2,
} from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import { analyzeSecurityHeaders, getHeaderScanHistory } from "../../api/headerAnalyzerApi";
import "./SecurityHeaderAnalyzer.css";

const MAX_SCORE = 100;

const RISK_META = {
  Low: { color: "#22c55e", icon: ShieldCheck, label: "Low Risk" },
  Medium: { color: "#f59e0b", icon: AlertTriangle, label: "Medium Risk" },
  High: { color: "#ef4444", icon: ShieldAlert, label: "High Risk" },
};

const SEVERITY_COLOR = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

function scoreColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function SecurityHeaderAnalyzer() {
  const { mode, toggleTheme, isLight } = useTheme();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = await getHeaderScanHistory();
        if (Array.isArray(data)) setHistory(data);
      } catch {
        // silent — history is optional
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, []);

  const stats = useMemo(() => {
    if (!result) return null;
    const results = result.analysis?.results || [];
    const present = results.filter((r) => r.exists).length;
    return {
      total: results.length,
      present,
      missing: results.length - present,
      score: result.analysis?.total_score || 0,
    };
  }, [result]);

  const riskMeta = result ? RISK_META[result.analysis?.risk_level] || RISK_META.High : null;

  const handleAnalyze = async (target = url) => {
    const normalized = normalizeUrl(target);
    if (!normalized) {
      setError("Please enter a valid URL.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setRawOpen(false);
    try {
      const data = await analyzeSecurityHeaders(normalized);
      setResult(data);
      setUrl(data.url || normalized);
      // Refresh history so the new scan appears immediately.
      try {
        const h = await getHeaderScanHistory();
        if (Array.isArray(h)) setHistory(h);
      } catch {
        // ignore
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to analyze headers. Make sure the URL is reachable and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError("");
    setUrl("");
  };

  return (
    <div className="sha-page">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <motion.div
        className="sha-hero"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="sha-hero__icon">
          <ShieldAlert size={26} />
        </div>
        <div className="sha-hero__text">
          <h1 className="sha-hero__title">Security Header Analyzer</h1>
          <p className="sha-hero__sub">
            Scan any website and evaluate the security hardening of its HTTP response headers.
          </p>
        </div>
        <button className="sha-theme-toggle" onClick={toggleTheme} aria-label="Toggle light / dark mode">
          {isLight ? <Moon size={18} /> : <Sun size={18} />}
          <span>{isLight ? "Dark" : "Light"}</span>
        </button>
      </motion.div>

      {/* ── Input Card ───────────────────────────────────────── */}
      <motion.div
        className="sha-card sha-input-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <div className="sha-input__wrap">
          <div className="sha-input__icon">
            <Globe size={20} />
          </div>
          <input
            type="text"
            className="sha-input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
            disabled={loading}
          />
          {url && !loading && (
            <button className="sha-input__clear" onClick={clearResult} aria-label="Clear input">
              <RotateCcw size={16} />
            </button>
          )}
          <button
            className="sha-scan-btn"
            onClick={() => handleAnalyze()}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="sha-spin" size={18} /> Analyzing…
              </>
            ) : (
              <>
                <Search size={18} /> Analyze Headers
              </>
            )}
          </button>
        </div>
        <p className="sha-input__hint">
          <Link2 size={13} /> Scans request the target URL and checks {`5`} security hardening headers. HTTPS is assumed
          when no protocol is provided.
        </p>
      </motion.div>

      {error && (
        <motion.div
          className="sha-error"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* ── Loading ──────────────────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="sha-card sha-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="sha-spin" size={30} />
            <p>Fetching and analyzing security headers…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────────── */}
      <AnimatePresence>
        {result && stats && riskMeta && !loading && (
          <motion.div
            className="sha-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary row */}
            <div className="sha-summary-grid">
              {/* Score gauge */}
              <div className="sha-card sha-gauge-card">
                <CircularProgressbar
                  value={stats.score}
                  maxValue={MAX_SCORE}
                  strokeWidth={10}
                  text={`${stats.score}`}
                  styles={buildStyles({
                    pathColor: scoreColor(stats.score),
                    trailColor: "var(--borderColor)",
                    textColor: "var(--textPrimary)",
                    textSize: "30px",
                    strokeLinecap: "round",
                    pathTransitionDuration: 0.9,
                  })}
                />
                <div className="sha-gauge__label">Header Security Score</div>
                <span
                  className="sha-risk-badge"
                  style={{ background: `${riskMeta.color}1f`, color: riskMeta.color, borderColor: `${riskMeta.color}55` }}
                >
                  <riskMeta.icon size={14} /> {riskMeta.label}
                </span>
              </div>

              {/* Stat tiles */}
              <div className="sha-stats-grid">
                <div className="sha-card sha-stat">
                  <div className="sha-stat__icon sha-stat--present">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="sha-stat__value" style={{ color: "#22c55e" }}>{stats.present}</div>
                    <div className="sha-stat__label">Present</div>
                  </div>
                </div>
                <div className="sha-card sha-stat">
                  <div className="sha-stat__icon sha-stat--missing">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <div className="sha-stat__value" style={{ color: "#ef4444" }}>{stats.missing}</div>
                    <div className="sha-stat__label">Missing</div>
                  </div>
                </div>
                <div className="sha-card sha-stat">
                  <div className="sha-stat__icon sha-stat--checked">
                    <FileCode2 size={20} />
                  </div>
                  <div>
                    <div className="sha-stat__value">{stats.total}</div>
                    <div className="sha-stat__label">Headers Checked</div>
                  </div>
                </div>
                <div className="sha-card sha-stat">
                  <div className="sha-stat__icon sha-stat--max">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="sha-stat__value">{MAX_SCORE}</div>
                    <div className="sha-stat__label">Max Score</div>
                  </div>
                </div>

                {/* Scanned URL */}
                <div className="sha-card sha-url-chip">
                  <Globe size={16} />
                  <span className="sha-url-chip__label">Scanned</span>
                  <a href={result.url} target="_blank" rel="noreferrer" className="sha-url-chip__value">
                    {result.url}
                  </a>
                </div>
              </div>
            </div>

            {/* Header detail list */}
            <div className="sha-card">
              <div className="sha-section-head">
                <h3 className="sha-section-title">
                  <ShieldCheck size={18} /> Header Evaluation
                </h3>
                <span className="sha-section-count">{stats.total} security headers</span>
              </div>

              <div className="sha-header-list">
                {result.analysis.results.map((item, idx) => {
                  const sevColor = SEVERITY_COLOR[item.severity] || "#64748b";
                  return (
                    <motion.div
                      key={item.header}
                      className={`sha-header-row ${item.exists ? "is-present" : "is-missing"}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <div className={`sha-header-status ${item.exists ? "ok" : "bad"}`}>
                        {item.exists ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </div>

                      <div className="sha-header-main">
                        <div className="sha-header-top">
                          <span className="sha-header-name">{item.header}</span>
                          {item.owasp && <span className="sha-owasp-tag">{item.owasp}</span>}
                        </div>
                        <div className="sha-header-scorebar">
                          <div
                            className="sha-header-scorebar__fill"
                            style={{
                              width: `${(item.score / item.max_score) * 100}%`,
                              background: item.exists ? "#22c55e" : "#ef4444",
                            }}
                          />
                        </div>
                        <p className="sha-header-reco">{item.recommendation}</p>
                      </div>

                      <div className="sha-header-side">
                        <span
                          className="sha-sev-badge"
                          style={{ background: `${sevColor}1c`, color: sevColor, borderColor: `${sevColor}44` }}
                        >
                          {item.severity}
                        </span>
                        <span className="sha-header-score">
                          {item.score}<small>/{item.max_score}</small>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Raw headers */}
            {result.headers && Object.keys(result.headers).length > 0 && (
              <div className="sha-card">
                <button className="sha-raw-toggle" onClick={() => setRawOpen((v) => !v)}>
                  <FileCode2 size={16} />
                  <span>Raw Response Headers</span>
                  {rawOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <AnimatePresence initial={false}>
                  {rawOpen && (
                    <motion.pre
                      className="sha-raw"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {Object.entries(result.headers)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join("\n")}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History ──────────────────────────────────────────── */}
      <div className="sha-card sha-history">
        <div className="sha-section-head">
          <h3 className="sha-section-title">
            <History size={18} /> Scan History
          </h3>
          <span className="sha-section-count">{history.length} record(s)</span>
        </div>

        {historyLoading ? (
          <div className="sha-history__empty">
            <Loader2 className="sha-spin" size={22} />
            <p>Loading history…</p>
          </div>
        ) : history.length > 0 ? (
          <div className="sha-history__list">
            {history.slice(0, 10).map((scan) => {
              const s = typeof scan.score === "number" ? scan.score : 0;
              const rMeta = RISK_META[scan.risk_level] || RISK_META.High;
              return (
                <div
                  key={scan._id}
                  className="sha-history__item"
                  onClick={() => handleAnalyze(scan.target_url)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze(scan.target_url)}
                >
                  <span className="sha-history__dot" style={{ background: rMeta.color }} />
                  <div className="sha-history__info">
                    <span className="sha-history__url">{scan.target_url}</span>
                    <span className="sha-history__time">
                      <Clock size={12} /> {scan.created_at ? new Date(scan.created_at).toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="sha-history__meta">
                    <span
                      className="sha-risk-badge sha-risk-badge--sm"
                      style={{ background: `${rMeta.color}1f`, color: rMeta.color, borderColor: `${rMeta.color}55` }}
                    >
                      {scan.risk_level}
                    </span>
                    <span className="sha-history__score" style={{ color: scoreColor(s) }}>{s}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="sha-history__empty">
            <History size={26} />
            <p>No header scans yet. Run your first analysis above.</p>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="sha-footer">
        Scores reflect the presence of key hardening headers. Higher score = stronger header security posture.
      </p>
    </div>
  );
}