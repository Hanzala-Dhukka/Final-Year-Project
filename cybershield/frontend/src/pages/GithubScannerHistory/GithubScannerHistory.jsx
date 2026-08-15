import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  History,
  Search,
  RefreshCw,
  Sun,
  Moon,
  GitFork,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Bug,
  AlertTriangle,
  ExternalLink,
  Box,
  ArrowLeft,
  X,
  Loader2,
  LayoutDashboard,
  GitBranch,
  CalendarDays,
  ListChecks,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "../../theme/useTheme";
import API from "../../api/api";
import "./GithubScannerHistory.css";

/* ── Helpers ─────────────────────────────────────────────── */

function riskColor(level) {
  switch ((level || "").toLowerCase()) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
      return "#22c55e";
    default:
      return "#64748b";
  }
}

function scoreColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#38bdf8";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function gradeFromRisk(riskScore) {
  if (riskScore >= 90) return "A";
  if (riskScore >= 80) return "B";
  if (riskScore >= 70) return "C";
  if (riskScore >= 60) return "D";
  return "F";
}

function gradeColor(grade) {
  if (!grade) return "#64748b";
  const g = grade.charAt(0).toUpperCase();
  if (g === "A") return "#22c55e";
  if (g === "B") return "#38bdf8";
  if (g === "C") return "#eab308";
  if (g === "D") return "#f97316";
  return "#ef4444";
}

function extractRepoFromUrl(url) {
  if (!url) return "";
  const match = String(url).match(/github\.com\/([^/]+\/[^/]+)/i);
  return match ? match[1] : "";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

function normalizeScans(list) {
  return (list || []).map((scan) => {
    const repoInfo = scan.repository_info || {};
    const repo =
      scan.repository ||
      repoInfo.repository ||
      extractRepoFromUrl(scan.repo_url) ||
      "Unknown Repository";
    const riskScore = Number(scan.risk_score ?? 0);
    const severity = scan.severity_summary || scan.scan_summary?.severity_counts || scan.summary || {};
    const deps = scan.dependency_report || {};

    return {
      id: scan._id || scan.scan_id || "",
      scanId: scan.scan_id || "",
      repo,
      repoUrl: scan.repo_url || repoInfo.url || repoInfo.html_url || "",
      branch: repoInfo.default_branch || scan.branch || "main",
      riskLevel: scan.risk_level || "Unknown",
      riskScore,
      securityScore: Math.max(0, Math.min(100, 100 - riskScore)),
      grade: gradeFromRisk(riskScore),
      filesScanned: Number(scan.scanned_files) || 0,
      vulns: Number(scan.vulnerabilities_found) || 0,
      findingsCount: Array.isArray(scan.findings) ? scan.findings.length : 0,
      createdAt: scan.created_at || "",
      severity: {
        Critical: severity.Critical || severity.critical || 0,
        High: severity.High || severity.high || 0,
        Medium: severity.Medium || severity.medium || 0,
        Low: severity.Low || severity.low || 0,
      },
      summary:
        scan.summary ||
        scan.scan_summary?.summary ||
        scan.ai_report?.summary ||
        (typeof scan.summary === "string" ? scan.summary : ""),
      recommendations:
        scan.recommendations || scan.ai_report?.recommendations || [],
      deps: {
        total: deps.total_packages ?? 0,
        outdated: deps.outdated ?? 0,
        risky: deps.risky ?? 0,
        unpinned: deps.unpinned ?? 0,
      },
      hasDeps: !!(deps.total_packages),
    };
  });
}

const SKELETON_ITEMS = [1, 2, 3, 4, 5, 6];

export default function GithubScannerHistory() {
  const { theme, mode, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmScan, setConfirmScan] = useState(null);

  /* ── Load history ───────────────────────────────────────── */
  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/github/scan-history");
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load scan history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /* ── Normalize + derive ─────────────────────────────────── */
  const scans = useMemo(() => normalizeScans(history), [history]);

  const stats = useMemo(() => {
    if (!scans.length) return null;
    const scores = scans.map((s) => s.securityScore);
    const critHigh = scans.reduce((acc, s) => acc + s.severity.Critical + s.severity.High, 0);
    const repos = new Set(scans.map((s) => s.repo));
    return {
      total: scans.length,
      repos: repos.size,
      avgSecurity: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestSecurity: Math.max(...scores),
      worstSecurity: Math.min(...scores),
      critHigh,
    };
  }, [scans]);

  const filtered = useMemo(() => {
    let list = [...scans];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.repo.toLowerCase().includes(q) ||
          (s.repoUrl || "").toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "oldest":
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "score-desc":
        list.sort((a, b) => b.securityScore - a.securityScore);
        break;
      case "score-asc":
        list.sort((a, b) => a.securityScore - b.securityScore);
        break;
      case "issues":
        list.sort((a, b) => b.findingsCount - a.findingsCount);
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [scans, search, sortBy]);

  /* ── Chart data ─────────────────────────────────────────── */
  const trendData = useMemo(() => {
    const sorted = [...scans].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return sorted.slice(-15).map((s, i) => ({
      name: `#${i + 1}`,
      score: s.securityScore,
      risk: s.riskScore,
      repo: s.repo,
      date: formatDate(s.createdAt),
    }));
  }, [scans]);

  const severityData = useMemo(() => {
    const agg = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    scans.forEach((s) => {
      agg.Critical += s.severity.Critical;
      agg.High += s.severity.High;
      agg.Medium += s.severity.Medium;
      agg.Low += s.severity.Low;
    });
    return [
      { name: "Critical", value: agg.Critical, color: "#ef4444" },
      { name: "High", value: agg.High, color: "#f97316" },
      { name: "Medium", value: agg.Medium, color: "#eab308" },
      { name: "Low", value: agg.Low, color: "#22c55e" },
    ].filter((d) => d.value > 0);
  }, [scans]);

  const chartGrid = theme?.chartGrid || (isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.10)");
  const chartLabel = theme?.chartLabel || "#94a3b8";
  const tooltipStyle = {
    background: theme?.cardBg || (isDark ? "#111827" : "#ffffff"),
    border: `1px solid ${theme?.borderStrong || (isDark ? "rgba(148,163,184,0.24)" : "rgba(15,23,42,0.18)")}`,
    borderRadius: 10,
    color: theme?.textPrimary || "#f1f5f9",
    fontSize: 13,
  };

  /* ── Actions ────────────────────────────────────────────── */
  const handleDelete = async (scan) => {
    setDeletingId(scan.id);
    setError("");
    try {
      await API.delete(`/github/scan/${encodeURIComponent(scan.id)}`);
      setHistory((prev) => prev.filter((h) => (h._id || h.scan_id) !== scan.id));
      setConfirmScan(null);
      setExpandedId(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete scan.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="gsh-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        className="gsh-hero"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="gsh-hero__icon">
          <History size={26} />
        </div>
        <div className="gsh-hero__text">
          <h1 className="gsh-hero__title">GitHub Scan History</h1>
          <p className="gsh-hero__sub">
            Track every repository scan, monitor security trends and review past findings.
          </p>
        </div>
        <div className="gsh-hero__actions">
          <button
            className="gsh-btn gsh-btn--ghost"
            onClick={() => navigate("/security-scanner")}
            aria-label="Back to GitHub Scanner"
            title="Back to GitHub Scanner"
          >
            <ArrowLeft size={18} />
            <span>Scanner</span>
          </button>
          <button
            className="gsh-btn gsh-btn--ghost"
            onClick={loadHistory}
            disabled={loading}
            aria-label="Refresh history"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "gsh-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            className="gsh-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </motion.div>

      {/* ── Error banner ───────────────────────────────────── */}
      {error && (
        <motion.div
          className="gsh-error"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* ── Loading skeletons ──────────────────────────────── */}
      {loading ? (
        <div className="gsh-skeleton-grid">
          {SKELETON_ITEMS.map((n) => (
            <div key={n} className="gsh-skeleton-card">
              <div className="gsh-skeleton-line gsh-skeleton-line--title" />
              <div className="gsh-skeleton-line gsh-skeleton-line--short" />
              <div className="gsh-skeleton-line" />
              <div className="gsh-skeleton-line gsh-skeleton-line--half" />
            </div>
          ))}
        </div>
      ) : scans.length === 0 ? (
        /* ── Empty state ───────────────────────────────────── */
        <motion.div
          className="gsh-empty"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="gsh-empty__icon">
            <GitFork size={44} />
          </div>
          <h2>No Scan History Yet</h2>
          <p>
            You haven't scanned any GitHub repositories. Start a scan to build your
            security history and track improvements over time.
          </p>
          <button className="gsh-btn gsh-btn--primary" onClick={() => navigate("/security-scanner")}>
            <LayoutDashboard size={18} />
            Go to GitHub Scanner
          </button>
        </motion.div>
      ) : (
        <>
          {/* ── Stats ───────────────────────────────────────── */}
          <motion.div
            className="gsh-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="gsh-stat">
              <div className="gsh-stat__icon gsh-stat__icon--indigo">
                <History size={20} />
              </div>
              <div>
                <span className="gsh-stat__value">{stats.total}</span>
                <span className="gsh-stat__label">Total Scans</span>
              </div>
            </div>
            <div className="gsh-stat">
              <div className="gsh-stat__icon gsh-stat__icon--cyan">
                <GitFork size={20} />
              </div>
              <div>
                <span className="gsh-stat__value">{stats.repos}</span>
                <span className="gsh-stat__label">Repositories</span>
              </div>
            </div>
            <div className="gsh-stat">
              <div className="gsh-stat__icon gsh-stat__icon--green">
                <Shield size={20} />
              </div>
              <div>
                <span
                  className="gsh-stat__value"
                  style={{ color: scoreColor(stats.avgSecurity) }}
                >
                  {stats.avgSecurity}
                </span>
                <span className="gsh-stat__label">Avg Security Score</span>
              </div>
            </div>
            <div className="gsh-stat">
              <div className="gsh-stat__icon gsh-stat__icon--blue">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="gsh-stat__value">{stats.critHigh}</span>
                <span className="gsh-stat__label">Critical + High</span>
              </div>
            </div>
            <div className="gsh-stat">
              <div className="gsh-stat__icon gsh-stat__icon--purple">
                <Bug size={20} />
              </div>
              <div>
                <span className="gsh-stat__value">{stats.bestSecurity}</span>
                <span className="gsh-stat__label">Best Score</span>
              </div>
            </div>
            <div className="gsh-stat">
              <div className="gsh-stat__icon gsh-stat__icon--amber">
                <Bug size={20} />
              </div>
              <div>
                <span className="gsh-stat__value">{stats.worstSecurity}</span>
                <span className="gsh-stat__label">Worst Score</span>
              </div>
            </div>
          </motion.div>

          {/* ── Charts ──────────────────────────────────────── */}
          <div className="gsh-charts">
            {trendData.length >= 2 && (
              <motion.div
                className="gsh-card gsh-chart"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="gsh-card__head">
                  <div className="gsh-card__title">
                    <span className="gsh-card__icon gsh-card__icon--cyan">
                      <Shield size={16} />
                    </span>
                    Security Score Trend
                  </div>
                  <span className="gsh-card__hint">Last {trendData.length} scans</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 16, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gshScoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="name" stroke={chartLabel} fontSize={12} tickMargin={8} />
                    <YAxis stroke={chartLabel} fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: chartLabel, fontWeight: 600 }}
                      formatter={(value, name) => [`${value}`, name === "score" ? "Security Score" : "Risk Score"]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${item.date} · ${item.repo}` : label;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#gshScoreFill)"
                      dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {severityData.length > 0 && (
              <motion.div
                className="gsh-card gsh-chart"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.14 }}
              >
                <div className="gsh-card__head">
                  <div className="gsh-card__title">
                    <span className="gsh-card__icon gsh-card__icon--red">
                      <Bug size={16} />
                    </span>
                    Findings by Severity
                  </div>
                  <span className="gsh-card__hint">All scans</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {severityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: chartLabel }}
                      formatter={(value, name) => [`${value} findings`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => <span style={{ color: chartLabel, fontSize: 13 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* ── Toolbar ─────────────────────────────────────── */}
          <div className="gsh-toolbar">
            <div className="gsh-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by repository..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              className="gsh-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort scans"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score-desc">Highest score</option>
              <option value="score-asc">Lowest score</option>
              <option value="issues">Most findings</option>
            </select>
            <span className="gsh-toolbar__count">
              {filtered.length} {filtered.length === 1 ? "scan" : "scans"}
            </span>
          </div>

          {/* ── Scan list ───────────────────────────────────── */}
          <div className="gsh-list">
            <AnimatePresence initial={false}>
              {filtered.map((scan, idx) => (
                <motion.div
                  key={scan.id || idx}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className={`gsh-scan ${expandedId === scan.id ? "gsh-scan--expanded" : ""}`}
                  style={{ "--gsh-accent": riskColor(scan.riskLevel) }}
                >
                  {/* Main row */}
                  <div className="gsh-scan__row">
                    {/* Repo identity */}
                    <div className="gsh-scan__identity">
                      <div className="gsh-scan__avatar">
                        <GitFork size={20} />
                      </div>
                      <div className="gsh-scan__meta">
                        <div className="gsh-scan__repo-line">
                          <span className="gsh-scan__repo">{scan.repo}</span>
                          <span className="gsh-scan__grade" style={{ color: gradeColor(scan.grade), borderColor: gradeColor(scan.grade) + "44", background: gradeColor(scan.grade) + "14" }}>
                            Grade {scan.grade}
                          </span>
                          <span className="gsh-scan__risk" style={{ color: riskColor(scan.riskLevel), background: riskColor(scan.riskLevel) + "18" }}>
                            {scan.riskLevel}
                          </span>
                        </div>
                        <div className="gsh-scan__sub">
                          <span><CalendarDays size={13} /> {formatDateTime(scan.createdAt)}</span>
                          <span><GitBranch size={13} /> {scan.branch}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="gsh-scan__score">
                      <span className="gsh-scan__score-value" style={{ color: scoreColor(scan.securityScore) }}>
                        {scan.securityScore}
                      </span>
                      <span className="gsh-scan__score-max">/100</span>
                      <div className="gsh-scan__bar">
                        <span
                          className="gsh-scan__bar-fill"
                          style={{ width: `${scan.securityScore}%`, background: scoreColor(scan.securityScore) }}
                        />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="gsh-scan__metrics">
                      <div className="gsh-scan__metric">
                        <FileCode2 size={14} />
                        <div>
                          <strong>{scan.filesScanned}</strong>
                          <span>Files</span>
                        </div>
                      </div>
                      <div className="gsh-scan__metric">
                        <Bug size={14} />
                        <div>
                          <strong>{scan.findingsCount}</strong>
                          <span>Findings</span>
                        </div>
                      </div>
                      {scan.hasDeps && (
                        <div className="gsh-scan__metric">
                          <Box size={14} />
                          <div>
                            <strong>{scan.deps.total}</strong>
                            <span>Packages</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="gsh-scan__actions">
                      {scan.repoUrl && (
                        <a
                          href={scan.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gsh-icon-btn"
                          title="Open repository"
                          aria-label="Open repository"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button
                        className="gsh-icon-btn gsh-icon-btn--danger"
                        onClick={() => setConfirmScan(scan)}
                        title="Delete scan"
                        aria-label="Delete scan"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="gsh-btn gsh-btn--expand"
                        onClick={() => toggleExpand(scan.id)}
                        aria-expanded={expandedId === scan.id}
                      >
                        {expandedId === scan.id ? (
                          <>
                            <ChevronUp size={16} /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} /> Details
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence initial={false}>
                    {expandedId === scan.id && (
                      <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="gsh-scan__details"
                      >
                        <div className="gsh-details-grid">
                          <div className="gsh-detail-block">
                            <h4>Severity Breakdown</h4>
                            <div className="gsh-severity">
                              {[
                                { key: "Critical", color: "#ef4444" },
                                { key: "High", color: "#f97316" },
                                { key: "Medium", color: "#eab308" },
                                { key: "Low", color: "#22c55e" },
                              ].map((s) => (
                                <div className="gsh-severity__row" key={s.key}>
                                  <span className="gsh-severity__dot" style={{ background: s.color }} />
                                  <span className="gsh-severity__name">{s.key}</span>
                                  <span className="gsh-severity__count" style={{ color: s.color }}>
                                    {scan.severity[s.key] ?? 0}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="gsh-detail-block gsh-detail-block--wide">
                            <h4>
                              <ListChecks size={14} /> Recommendations
                            </h4>
                            {scan.recommendations.length ? (
                              <ul className="gsh-recs">
                                {scan.recommendations.slice(0, 6).map((rec, i) => (
                                  <li key={i}>{typeof rec === "string" ? rec : rec?.recommendation || rec?.text || JSON.stringify(rec)}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="gsh-detail-empty">No recommendations recorded for this scan.</p>
                            )}
                          </div>

                          {scan.summary ? (
                            <div className="gsh-detail-block gsh-detail-block--wide">
                              <h4>Summary</h4>
                              <p className="gsh-summary">{scan.summary}</p>
                            </div>
                          ) : null}

                          {scan.hasDeps && (
                            <div className="gsh-detail-block">
                              <h4>
                                <Box size={14} /> Dependencies
                              </h4>
                              <div className="gsh-dep-grid">
                                <div><strong>{scan.deps.total}</strong><span>Total</span></div>
                                <div className="gsh-dep--warn"><strong>{scan.deps.outdated}</strong><span>Outdated</span></div>
                                <div className="gsh-dep--danger"><strong>{scan.deps.risky}</strong><span>Risky</span></div>
                                <div><strong>{scan.deps.unpinned}</strong><span>Unpinned</span></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && !loading && (
              <div className="gsh-no-results">
                <Search size={22} />
                <p>No scans match "{search}".</p>
                <button className="gsh-btn gsh-btn--ghost" onClick={() => setSearch("")}>
                  Clear search
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Delete confirmation modal ───────────────────────── */}
      <AnimatePresence>
        {confirmScan && (
          <motion.div
            className="gsh-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmScan(null)}
          >
            <motion.div
              className="gsh-modal"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="gsh-modal__icon">
                <Trash2 size={22} />
              </div>
              <h3>Delete this scan?</h3>
              <p>
                The scan record for <strong>{confirmScan.repo}</strong> from{" "}
                <strong>{formatDateTime(confirmScan.createdAt)}</strong> will be permanently removed
                from your history.
              </p>
              <div className="gsh-modal__actions">
                <button className="gsh-btn gsh-btn--ghost" onClick={() => setConfirmScan(null)} disabled={deletingId === confirmScan.id}>
                  Cancel
                </button>
                <button
                  className="gsh-btn gsh-btn--danger"
                  onClick={() => handleDelete(confirmScan)}
                  disabled={deletingId === confirmScan.id}
                >
                  {deletingId === confirmScan.id ? (
                    <>
                      <Loader2 size={16} className="gsh-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Delete Scan
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}