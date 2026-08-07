import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getReportHistory,
  deleteReport,
  downloadPdf,
} from "../../api/reportApi";
import { getThreatReports } from "../../api/threatApi";
import "./ThreatReports.css";

/* ------------------------------------------------------------------ */
/*  Tiny SVG icons (inline so we avoid extra deps)                     */
/* ------------------------------------------------------------------ */
const Icons = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  alertTriangle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  arrowUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ),
  minus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  refresh: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  ),
  calendar: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  fileText: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Risk config                                                        */
/* ------------------------------------------------------------------ */
const RISK_CONFIG = {
  critical: { icon: Icons.alertTriangle, colorClass: "critical", label: "Critical" },
  high:     { icon: Icons.arrowUp,        colorClass: "high",     label: "High" },
  medium:   { icon: Icons.minus,          colorClass: "medium",   label: "Medium" },
  low:      { icon: Icons.check,          colorClass: "low",      label: "Low" },
};

function getRiskMeta(level) {
  return RISK_CONFIG[(level || "").toLowerCase()] || {
    icon: Icons.shield,
    colorClass: "unknown",
    label: level || "Unknown",
  };
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ------------------------------------------------------------------ */
/*  Skeleton card                                                      */
/* ------------------------------------------------------------------ */
function SkeletonCard() {
  return (
    <div className="tr-card tr-card--unknown" style={{ pointerEvents: "none" }}>
      <div className="tr-card__top">
        <div style={{ height: 14, borderRadius: 6, background: "var(--surface-hover)", flex: 1 }} />
        <div style={{ height: 22, borderRadius: 999, width: 72, background: "var(--surface-hover)" }} />
      </div>
      <div style={{ height: 10, borderRadius: 4, background: "var(--surface-hover)", width: "90%" }} />
      <div style={{ height: 10, borderRadius: 4, background: "var(--surface-hover)", width: "60%" }} />
      <div className="tr-card__meta">
        <div style={{ height: 10, borderRadius: 4, background: "var(--surface-hover)", width: 100 }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function ThreatReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleting, setDeleting] = useState(null);

  /* ---- Fetch reports from both API sources ---- */
  const fetchReports = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [resHistory, resThreats] = await Promise.allSettled([
        getReportHistory(100),
        getThreatReports(),
      ]);

      const combined = [];

      // Security scan reports from /reports/history
      // Response shape: { reports: [...], count: N }
      if (resHistory.status === "fulfilled") {
        const val = resHistory.value;
        const items = Array.isArray(val) ? val : val?.reports || val?.data || [];
        items.forEach((r) => {
          const id = r.report_id || r.scan_id || r._id || r.id;
          if (!id) return;
          combined.push({
            id,
            title: r.title || r.project_name || "Security Report",
            risk: r.risk_level || r.overall_risk || "Unknown",
            summary: r.summary || r.executive_summary || "",
            created: r.created_at || r.createdAt,
            type: "scan",
            source: "GitHub Scanner",
            scanId: r.scan_id,
          });
        });
      }

      // Threat model reports from /threat-dashboard/reports
      if (resThreats.status === "fulfilled") {
        const val = resThreats.value;
        const items = Array.isArray(val) ? val : val?.data || val?.reports || [];
        items.forEach((r) => {
          const id = r.report_id || r._id || r.id;
          if (!id) return;
          combined.push({
            id,
            title: r.project || r.title || "Threat Model Report",
            risk: r.overall_risk || r.risk_level || "Unknown",
            summary: r.executive_summary || r.summary || "",
            created: r.created_at || r.createdAt || r.timestamp,
            type: "threat",
            source: "Threat Modeling",
            threats: r.threats_found,
          });
        });
      }

      // Deduplicate by id (same report from two sources)
      const seen = new Set();
      const deduped = combined.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      setReports(deduped);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  /* ---- Stats ---- */
  const stats = useMemo(() => {
    const s = { total: reports.length, critical: 0, high: 0, medium: 0, low: 0 };
    reports.forEach((r) => {
      const k = (r.risk || "").toLowerCase();
      if (k === "critical") s.critical++;
      else if (k === "high") s.high++;
      else if (k === "medium") s.medium++;
      else if (k === "low") s.low++;
    });
    return s;
  }, [reports]);

  /* ---- Filter + Sort ---- */
  const displayed = useMemo(() => {
    let list = [...reports];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.summary && r.summary.toLowerCase().includes(q)) ||
          r.source.toLowerCase().includes(q)
      );
    }

    // risk filter
    if (riskFilter !== "all") {
      list = list.filter((r) => (r.risk || "").toLowerCase() === riskFilter);
    }

    // sort
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.created || 0) - new Date(b.created || 0));
    } else if (sortBy === "risk") {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      list.sort((a, b) => (order[(a.risk || "").toLowerCase()] ?? 99) - (order[(b.risk || "").toLowerCase()] ?? 99));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [reports, search, riskFilter, sortBy]);

  /* ---- Actions ---- */
  const handleView = (report) => {
    if (report.type === "threat") {
      navigate(`/threat-reports/${report.id}`);
    } else if (report.scanId) {
      navigate(`/scanner/results/${report.scanId}`);
    } else {
      navigate(`/threat-reports/${report.id}`);
    }
  };

  const handleDownload = async (e, report) => {
    e.stopPropagation();
    try {
      await downloadPdf(report.id);
    } catch {
      // Fallback: navigate to viewer
      handleView(report);
    }
  };

  const handleDelete = async (e, report) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${report.title}"? This action cannot be undone.`)) return;
    try {
      setDeleting(report.id);
      await deleteReport(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  /* ---- Render ---- */
  return (
    <div className="tr-page">
      {/* Header */}
      <motion.div
        className="tr-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="tr-header__title">Threat Reports</h1>
          <p className="tr-header__subtitle">
            View and manage your security scan and threat model reports
          </p>
        </div>
        <button
          className={`tr-refresh-btn ${refreshing ? "tr-refresh-btn--spinning" : ""}`}
          onClick={() => fetchReports(true)}
          disabled={refreshing}
        >
          {Icons.refresh}
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="tr-stats"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {[
          { key: "total",    value: stats.total,    label: "Total Reports",   icon: Icons.shield,      iconClass: "total" },
          { key: "critical", value: stats.critical, label: "Critical",        icon: Icons.alertTriangle, iconClass: "critical" },
          { key: "high",     value: stats.high,     label: "High Risk",       icon: Icons.arrowUp,     iconClass: "high" },
          { key: "medium",   value: stats.medium,   label: "Medium Risk",     icon: Icons.minus,       iconClass: "medium" },
          { key: "low",      value: stats.low,      label: "Low Risk",        icon: Icons.check,       iconClass: "low" },
        ].map((s, i) => (
          <motion.div
            key={s.key}
            className="tr-stat-card"
            variants={fadeUp}
            custom={i}
          >
            <div className={`tr-stat-card__icon tr-stat-card__icon--${s.iconClass}`}>
              {s.icon}
            </div>
            <div>
              <div className="tr-stat-card__value">{s.value}</div>
              <div className="tr-stat-card__label">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 10,
              background: "var(--danger-soft)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      {!loading && reports.length > 0 && (
        <motion.div
          className="tr-toolbar"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <div className="tr-search">
            <span className="tr-search__icon">{Icons.search}</span>
            <input
              className="tr-search__input"
              type="text"
              placeholder="Search reports by title, summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="tr-filter-group">
            {[
              { value: "all",      label: "All" },
              { value: "critical", label: "Critical" },
              { value: "high",     label: "High" },
              { value: "medium",   label: "Medium" },
              { value: "low",      label: "Low" },
            ].map((f) => (
              <button
                key={f.value}
                className={`tr-filter-btn ${riskFilter === f.value ? "tr-filter-btn--active" : ""}`}
                onClick={() => setRiskFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="tr-sort">
            {Icons.filter}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="risk">Risk Level</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="tr-skeleton">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <motion.div
          className="tr-empty"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="tr-empty__icon">{Icons.inbox}</div>
          <h3 className="tr-empty__title">No Reports Yet</h3>
          <p className="tr-empty__desc">
            Run a security scan or create a threat model to generate your first report.
            Reports will appear here automatically.
          </p>
        </motion.div>
      )}

      {/* No results after filter */}
      {!loading && reports.length > 0 && displayed.length === 0 && (
        <motion.div
          className="tr-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tr-empty__icon" style={{ background: "var(--warning-soft)" }}>
            <span style={{ color: "var(--warning)" }}>{Icons.search}</span>
          </div>
          <h3 className="tr-empty__title">No Matching Reports</h3>
          <p className="tr-empty__desc">
            Try adjusting your search or filter criteria.
          </p>
        </motion.div>
      )}

      {/* Reports grid */}
      {!loading && displayed.length > 0 && (
        <motion.div
          className="tr-reports-grid"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {displayed.map((report, idx) => {
              const risk = getRiskMeta(report.risk);
              return (
                <motion.div
                  key={report.id || idx}
                  className={`tr-card tr-card--${risk.colorClass}`}
                  variants={fadeUp}
                  custom={idx}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleView(report)}
                  style={{ opacity: deleting === report.id ? 0.5 : 1 }}
                >
                  <div className="tr-card__top">
                    <h3 className="tr-card__title">{report.title}</h3>
                    <span className={`tr-card__badge tr-card__badge--${risk.colorClass}`}>
                      {risk.icon}
                      {risk.label}
                    </span>
                  </div>

                  {report.summary && (
                    <p className="tr-card__summary">{report.summary}</p>
                  )}

                  <div className="tr-card__meta">
                    <div className="tr-card__meta-left">
                      <span className="tr-card__meta-item">
                        {Icons.calendar}
                        {report.created
                          ? new Date(report.created).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </span>
                      <span className="tr-card__meta-item">
                        {Icons.fileText}
                        {report.source}
                      </span>
                      {report.threats != null && (
                        <span className="tr-card__meta-item">
                          {Icons.alertTriangle}
                          {report.threats} threats
                        </span>
                      )}
                    </div>

                    <div className="tr-card__actions">
                      <button
                        className="tr-card__action-btn"
                        title="View Report"
                        onClick={(e) => { e.stopPropagation(); handleView(report); }}
                      >
                        {Icons.eye}
                      </button>
                      <button
                        className="tr-card__action-btn"
                        title="Download PDF"
                        onClick={(e) => handleDownload(e, report)}
                      >
                        {Icons.download}
                      </button>
                      <button
                        className="tr-card__action-btn tr-card__action-btn--danger"
                        title="Delete Report"
                        onClick={(e) => handleDelete(e, report)}
                        disabled={deleting === report.id}
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
