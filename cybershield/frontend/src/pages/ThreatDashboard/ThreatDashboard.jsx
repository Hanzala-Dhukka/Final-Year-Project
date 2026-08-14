import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Radar,
  ShieldCheck,
  Target,
  Network,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
  AlertTriangle,
  SearchX,
  Activity,
} from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import {
  getDashboard,
  getDashboardReports,
  getRiskHistory,
} from "../../api/threatDashboardApi";
import { scoreColor } from "../../components/ThreatDashboard/severity";
import RiskGauge from "../../components/ThreatDashboard/RiskGauge";
import STRIDERadar from "../../components/ThreatDashboard/STRIDERadar";
import RiskPieChart from "../../components/ThreatDashboard/RiskPieChart";
import RiskTrendChart from "../../components/ThreatDashboard/RiskTrendChart";
import AttackSurfaceDiagram from "../../components/ThreatDashboard/AttackSurfaceDiagram";
import OWASPChart from "../../components/ThreatDashboard/OWASPChart";
import MITRETimeline from "../../components/ThreatDashboard/MITRETimeline";
import RecommendationPanel from "../../components/ThreatDashboard/RecommendationPanel";
import ExecutiveSummaryCard from "../../components/ThreatDashboard/ExecutiveSummaryCard";
import ThreatComparison from "../../components/ThreatDashboard/ThreatComparison";
import "./ThreatDashboard.css";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

function SkeletonCard() {
  return (
    <div className="td-skeleton">
      <span className="td-skeleton__bar td-skeleton__bar--title" />
      <span className="td-skeleton__bar" />
      <span className="td-skeleton__bar td-skeleton__bar--short" />
      <span className="td-skeleton__shape" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <motion.div {...fadeUp} className="td-skeleton-grid">
      <div className="td-kpis td-kpis--skeleton">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="td-tile td-tile--skeleton" />
        ))}
      </div>
      <div className="td-grid td-grid--split">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="td-grid td-grid--split">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="td-grid td-grid--full">
        <SkeletonCard />
      </div>
    </motion.div>
  );
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ThreatDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [reportId, setReportId] = useState(id || "");
  const [reports, setReports] = useState([]);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (value, silent = false) => {
    if (!value) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await getDashboard(value);
      setData(res.data);
    } catch (e) {
      setError("Unable to load this report. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load the report picker + risk history once.
  useEffect(() => {
    (async () => {
      try {
        const [r, h] = await Promise.all([getDashboardReports(), getRiskHistory()]);
        setReports(r.data || []);
        setHistory(h.data || []);
        return r.data || [];
      } catch {
        return [];
      }
    })().then((list) => {
      if (!id && list.length) {
        setReportId(list[0].report_id);
      }
    });
  }, [id]);

  // Load dashboard when the selected report changes.
  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }
    fetchDashboard(reportId, !!data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const onPick = (value) => {
    setReportId(value);
    navigate(value ? `/threat-dashboard/${value}` : "/threat-dashboard");
  };

  const totalThreats = data
    ? (data.distribution?.critical || 0) +
      (data.distribution?.high || 0) +
      (data.distribution?.medium || 0) +
      (data.distribution?.low || 0)
    : 0;

  const tiles = data
    ? [
        {
          key: "score",
          label: "Security Score",
          value: data.risk_score,
          sub: data.risk_level,
          icon: <ShieldCheck size={20} />,
          tone: scoreColor(data.risk_score),
        },
        {
          key: "threats",
          label: "Threats Detected",
          value: totalThreats,
          sub: "across all severities",
          icon: <Target size={20} />,
          tone: "var(--primary)",
        },
        {
          key: "surface",
          label: "Attack Surface",
          value: data.attack_surface?.length || 0,
          sub: "exposed components",
          icon: <Network size={20} />,
          tone: "var(--accentPurple)",
        },
        {
          key: "recos",
          label: "Recommendations",
          value: data.recommendations?.length || 0,
          sub: "prioritized actions",
          icon: <Sparkles size={20} />,
          tone: "var(--success)",
        },
      ]
    : [];

  return (
    <div className="td-page">
      {/* Hero header */}
      <motion.section {...fadeUp} className="td-hero">
        <div className="td-hero__left">
          <div className="td-hero__icon">
            <Radar size={22} />
          </div>
          <div className="td-hero__titles">
            <h1 className="td-hero__title">Threat Dashboard</h1>
            <p className="td-hero__sub">
              Interactive threat-model analytics for your AI-generated reports
            </p>
          </div>
        </div>

        <div className="td-hero__right">
          <div className="td-select-wrap">
            <span className="td-select-label">Report</span>
            <select
              className="td-select"
              value={reportId}
              onChange={(e) => onPick(e.target.value)}
              disabled={loading && !reportId}
              aria-label="Select threat report"
            >
              {reports.length === 0 && (
                <option value="" disabled>
                  No reports yet
                </option>
              )}
              {reports.map((r) => (
                <option key={r.report_id} value={r.report_id}>
                  {r.project}
                </option>
              ))}
            </select>
            <ChevronDown className="td-select__chevron" size={16} aria-hidden="true" />
          </div>

          <button
            type="button"
            className="td-icon-btn"
            onClick={() => fetchDashboard(reportId, true)}
            disabled={!reportId || refreshing}
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={17} className={refreshing ? "td-spin" : ""} />
          </button>

          <button
            type="button"
            className="td-icon-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </motion.section>

      {/* Meta strip */}
      {!loading && data && (
        <motion.div {...fadeUp} className="td-meta" transition={{ delay: 0.05 }}>
          <span className="td-meta__chip">
            <Activity size={13} />
            {reports.length} {reports.length === 1 ? "report" : "reports"}
          </span>
          {data.project && <span className="td-meta__chip">{data.project}</span>}
          {formatDate(data.created_at) && (
            <span className="td-meta__chip">Updated {formatDate(data.created_at)}</span>
          )}
        </motion.div>
      )}

      {/* Error banner (keep last good data visible) */}
      {error && (
        <motion.div {...fadeUp} className="td-alert" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => fetchDashboard(reportId, true)}>
            Retry
          </button>
        </motion.div>
      )}

      {loading && <LoadingSkeleton />}

      {/* Empty state — no reports exist yet */}
      {!loading && !data && !error && reports.length === 0 && (
        <motion.div {...fadeUp} className="td-empty">
          <div className="td-empty__icon">
            <SearchX size={30} />
          </div>
          <h2>No threat reports yet</h2>
          <p>
            Run the Security Scanner or create a threat analysis model to populate
            this dashboard.
          </p>
          <Link to="/security-scanner" className="td-empty__cta">
            Open Security Scanner
          </Link>
        </motion.div>
      )}

      {!loading && data && (
        <>
          {/* KPI tiles */}
          <motion.section {...fadeUp} className="td-kpis" transition={{ delay: 0.08 }}>
            {tiles.map((tile) => (
              <div className="td-tile" key={tile.key}>
                <span className="td-tile__chip" style={{ color: tile.tone, borderColor: tile.tone }}>
                  {tile.icon}
                </span>
                <div className="td-tile__body">
                  <span className="td-tile__value" style={{ color: tile.tone }}>
                    {tile.value}
                  </span>
                  <span className="td-tile__label">{tile.label}</span>
                  <span className="td-tile__sub">{tile.sub}</span>
                </div>
              </div>
            ))}
          </motion.section>

          {/* Row 1 — Security score gauge + executive summary */}
          <motion.div
            {...fadeUp}
            className="td-grid td-grid--split"
            transition={{ delay: 0.12 }}
          >
            <section className="td-widget">
              <header className="td-widget__head">
                <ShieldCheck size={16} />
                <span>Security Score</span>
              </header>
              <div className="td-widget__body td-widget__body--center">
                <RiskGauge score={data.risk_score} level={data.risk_level} />
              </div>
            </section>
            <ExecutiveSummaryCard
              executive={data.executive || {}}
              project={data.project}
              score={data.risk_score}
            />
          </motion.div>

          {/* Row 2 — STRIDE + risk distribution */}
          <motion.div
            {...fadeUp}
            className="td-grid td-grid--split"
            transition={{ delay: 0.16 }}
          >
            <STRIDERadar stride={data.stride || {}} />
            <RiskPieChart distribution={data.distribution || {}} />
          </motion.div>

          {/* Row 3 — attack surface */}
          <motion.div
            {...fadeUp}
            className="td-grid td-grid--full"
            transition={{ delay: 0.2 }}
          >
            <AttackSurfaceDiagram nodes={data.attack_surface || []} />
          </motion.div>

          {/* Row 4 — OWASP + MITRE */}
          <motion.div
            {...fadeUp}
            className="td-grid td-grid--split"
            transition={{ delay: 0.24 }}
          >
            <OWASPChart owasp={data.owasp || []} />
            <MITRETimeline mitre={data.mitre || []} />
          </motion.div>

          {/* Row 5 — recommendations + risk trend */}
          <motion.div
            {...fadeUp}
            className="td-grid td-grid--split"
            transition={{ delay: 0.28 }}
          >
            <RecommendationPanel recommendations={data.recommendations || []} />
            <RiskTrendChart timeline={[...history].reverse()} />
          </motion.div>

          {/* Row 6 — report comparison */}
          <motion.div
            {...fadeUp}
            className="td-grid td-grid--full"
            transition={{ delay: 0.32 }}
          >
            <ThreatComparison reports={reports} />
          </motion.div>
        </>
      )}
    </div>
  );
}