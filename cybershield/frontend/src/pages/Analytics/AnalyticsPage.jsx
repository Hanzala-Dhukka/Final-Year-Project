import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import ShieldIcon from "@mui/icons-material/Shield";
import BugReportIcon from "@mui/icons-material/BugReport";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PolicyIcon from "@mui/icons-material/Policy";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import BusinessIcon from "@mui/icons-material/Business";
import RadarIcon from "@mui/icons-material/Radar";
import HistoryIcon from "@mui/icons-material/History";
import StorageIcon from "@mui/icons-material/Storage";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { analyticsApi, downloadBlob } from "../../api/analyticsApi";

/* ── Design tokens ─────────────────────────────────────────────────────── */
const RISK_COLOR = {
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#F59E0B",
  Low: "#22C55E",
  Safe: "#22C55E",
};

const SEVERITY_COLOR = {
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#F59E0B",
  Low: "#22C55E",
};

const SOURCE_META = {
  github: { label: "GitHub Scans", color: "#38BDF8" },
  threat: { label: "Threat Analysis", color: "#818CF8" },
  compliance: { label: "Compliance", color: "#C084FC" },
  checklist: { label: "Checklist", color: "#34D399" },
  owasp: { label: "OWASP Labs", color: "#FBBF24" },
  quiz: { label: "Quiz", color: "#F472B6" },
};

/* Theme-aware glass card (follows the app's light/dark mode via CSS vars). */
const GLASS = {
  background: "var(--glassBg)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--glassBorder)",
  borderRadius: "12px",
  boxShadow: "var(--shadow)",
};

function Section({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ icon, color, title, sub }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${color}1f`,
          color,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--textPrimary)" }}>
          {title}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>{sub}</Typography>
        )}
      </Box>
    </Stack>
  );
}

/* ── Chart tooltip (dark themed, works on both modes) ──────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: "rgba(2, 6, 23, 0.95)",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: 2,
        px: 1.5,
        py: 1,
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      {label != null && (
        <Typography sx={{ fontSize: 11.5, color: "#94A3B8", mb: 0.5 }}>{label}</Typography>
      )}
      {payload.map((p) => (
        <Typography key={p.dataKey} sx={{ fontSize: 12, color: "#E2E8F0" }}>
          <Box component="span" sx={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, bgcolor: p.color, mr: 1 }} />
          {p.name}: <b>{Number.isFinite(p.value) ? p.value.toLocaleString() : p.value}</b>
        </Typography>
      ))}
    </Box>
  );
}

const AXIS = { fill: "var(--chartLabel)", fontSize: 11 };
const GRID = { strokeDasharray: "3 3", stroke: "var(--chartGrid)", vertical: false };

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("security_score");

  const loadAll = useCallback(async (sb) => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, statsRes, recentRes, vulnRes] = await Promise.all([
        analyticsApi.getSummary(sb),
        analyticsApi.getDashboardStats(),
        analyticsApi.getRecentScans(),
        analyticsApi.getVulnerabilities(),
      ]);
      setData({
        ...summaryRes.data,
        vulnSeries: vulnRes.data || [],
        platformStats: statsRes.data || {},
        recentScans: Array.isArray(recentRes.data) ? recentRes.data : [],
      });
    } catch (e) {
      console.error("Analytics load failed", e);
      setError("Unable to load analytics. Make sure you are connected to the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(sortBy);
  }, [sortBy, loadAll]);

  const onRefresh = () => loadAll(sortBy);
  const onExportPdf = async () => {
    try {
      const res = await analyticsApi.exportPdf();
      downloadBlob(res, "Security_Analytics_Report.pdf");
    } catch {
      setError("Failed to export PDF.");
    }
  };
  const onExportJson = async () => {
    try {
      const res = await analyticsApi.exportJson();
      downloadBlob(res, "Security_Analytics_Report.json");
    } catch {
      setError("Failed to export JSON.");
    }
  };

  const kpis = data?.kpis || {};
  const trends = data?.trends || [];
  const comparison = data?.comparison || [];
  const ai = data?.ai_summary || {};

  const sources = useMemo(() => data?.source_scores || {}, [data]);
  const vulnSeries = useMemo(() => data?.vulnSeries || [], [data]);

  const riskColor = RISK_COLOR[kpis.risk_level] || "#64748B";

  /* Latest severity distribution (user-scoped) */
  const latestSeverity = useMemo(() => {
    const last = vulnSeries[vulnSeries.length - 1] || {};
    return [
      { name: "Critical", value: Number(last.critical ?? 0) },
      { name: "High", value: Number(last.high ?? 0) },
      { name: "Medium", value: Number(last.medium ?? 0) },
      { name: "Low", value: Number(last.low ?? 0) },
    ].filter((s) => s.value > 0);
  }, [vulnSeries]);

  const totalVulns = latestSeverity.reduce((a, s) => a + s.value, 0);

  /* Source contribution to the global score */
  const sourceData = useMemo(
    () =>
      Object.entries(SOURCE_META)
        .map(([key, meta]) => ({ name: meta.label, key, value: Number(sources[key] ?? 0), color: meta.color }))
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value),
    [sources]
  );

  const trendGain =
    trends.length >= 2
      ? (Number(trends[trends.length - 1]?.security_score ?? 0) - Number(trends[0]?.security_score ?? 0)).toFixed(1)
      : 0;

  const recentScans = (data?.recentScans || []).slice(0, 6).map((s) => ({
    id: s._id || s.id,
    repository: s.repository || s.repo_url || "Repository scan",
    repo_url: s.repo_url || "",
    vulnerabilities: s.vulnerabilities_found ?? s.severity_summary?.critical ?? 0,
    risk: s.risk_level || "Unknown",
    files: s.scanned_files ?? 0,
    date: s.created_at ? new Date(s.created_at).toLocaleString() : "—",
  }));

  const muted = "var(--textMuted)";
  const secondary = "var(--textSecondary)";
  const primary = "var(--textPrimary)";
  const divider = "var(--borderColor)";

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Section>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #38BDF8 0%, #6366F1 55%, #A855F7 100%)",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(99,102,241,0.45)",
              }}
            >
              <RadarIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: primary }}>
                Security Analytics
              </Typography>
              <Typography sx={{ color: secondary, fontSize: 13.5 }}>
                Monitor scans, vulnerabilities, compliance and project posture in one place.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel id="sort-by-label" sx={{ color: secondary }}>
                Sort projects by
              </InputLabel>
              <Select
                labelId="sort-by-label"
                label="Sort projects by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="security_score">Security Score</MenuItem>
                <MenuItem value="risk_level">Risk Level</MenuItem>
                <MenuItem value="compliance_score">Compliance</MenuItem>
                <MenuItem value="open_vulnerabilities">Vulnerabilities</MenuItem>
                <MenuItem value="last_scan">Last Scan</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
              sx={{
                background: "linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)",
                "&:hover": { filter: "brightness(1.08)" },
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Section>

      {(error || data?.ai_summary) && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          {error && (
            <Alert severity="info" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
          {!error && data && (
            <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
              <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onExportPdf}>
                PDF
              </Button>
              <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={onExportJson}>
                JSON
              </Button>
            </Stack>
          )}
        </Stack>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography sx={{ color: secondary }}>Loading analytics...</Typography>
          </Stack>
        </Box>
      )}

      {!loading && data && (
        <>
          {/* ── KPI hero row (rectangular cards) ────────────────────────── */}
          <Section>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
                gap: 2.5,
              }}
            >
              {/* Security score hero */}
              <Box
                sx={{
                  ...GLASS,
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                  background: `linear-gradient(135deg, ${riskColor}22 0%, var(--glassBg) 60%)`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <ShieldIcon sx={{ color: "#38BDF8", fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Global Security Score
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="baseline">
                  <Typography sx={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: primary }}>
                    {Number(kpis.security_score ?? 0).toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: muted }}>%</Typography>
                </Stack>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    size="small"
                    label={kpis.risk_level || "Unknown"}
                    sx={{
                      bgcolor: `${riskColor}26`,
                      color: riskColor,
                      fontWeight: 700,
                      border: `1px solid ${riskColor}55`,
                    }}
                  />
                  {trends.length >= 2 && (
                    <Typography sx={{ fontSize: 12, color: Number(trendGain) >= 0 ? "#16A34A" : "#DC2626", display: "flex", alignItems: "center", gap: 0.3 }}>
                      {Number(trendGain) >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                      {Number(trendGain) >= 0 ? "+" : ""}{trendGain}% since first snapshot
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Open vulnerabilities */}
              <Box sx={{ ...GLASS, p: 2.5, display: "flex", flexDirection: "column", gap: 1.2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BugReportIcon sx={{ color: "#F87171", fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Open Vulnerabilities
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: primary }}>
                  {Number(kpis.open_vulnerabilities ?? 0).toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: 12, color: muted }}>
                  <Box component="span" sx={{ color: "#DC2626", fontWeight: 700 }}>{kpis.critical ?? 0} critical</Box> ·{" "}
                  <Box component="span" sx={{ color: "#EA580C", fontWeight: 700 }}>{kpis.high ?? 0} high</Box> across your projects
                </Typography>
              </Box>

              {/* Projects monitored */}
              <Box sx={{ ...GLASS, p: 2.5, display: "flex", flexDirection: "column", gap: 1.2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FolderOpenIcon sx={{ color: "#818CF8", fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Projects Monitored
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: primary }}>
                  {kpis.projects ?? 0}
                </Typography>
                <Typography sx={{ fontSize: 12, color: muted }}>
                  Last scan: <Box component="span" sx={{ color: secondary }}>{kpis.last_scan || "Never"}</Box>
                </Typography>
              </Box>

              {/* Compliance + checklist */}
              <Box sx={{ ...GLASS, p: 2.5, display: "flex", flexDirection: "column", gap: 1.4 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PolicyIcon sx={{ color: "#C084FC", fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Compliance &amp; Hardening
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: "#9333EA" }}>
                      {Number(kpis.compliance ?? 0).toFixed(0)}%
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.5 }}>Compliance</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: "#16A34A" }}>
                      {Number(kpis.checklist_progress ?? 0).toFixed(0)}%
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.5 }}>Checklist done</Typography>
                  </Box>
                </Stack>
                <Box sx={{ height: 6, borderRadius: 99, bgcolor: "var(--chartGrid)", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: 99,
                      width: `${Math.min(100, Number(kpis.compliance ?? 0))}%`,
                      background: "linear-gradient(90deg,#C084FC,#38BDF8)",
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Section>

          {/* ── Trend charts ─────────────────────────────────────────────── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
              gap: 2.5,
              mt: 2.5,
            }}
          >
            <Section>
              <Box sx={{ ...GLASS, p: 2.5, height: "100%" }}>
                <CardTitle
                  icon={<TrendingUpIcon />}
                  color="#38BDF8"
                  title="Security & Compliance Trend"
                  sub="Global score over recorded snapshots"
                />
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradSec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C084FC" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#C084FC" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...GRID} />
                      <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <RTooltip content={<ChartTip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: secondary }} />
                      <Area type="monotone" dataKey="security_score" name="Security" stroke="#38BDF8" strokeWidth={2.5} fill="url(#gradSec)" />
                      <Area type="monotone" dataKey="compliance_score" name="Compliance" stroke="#C084FC" strokeWidth={2.5} fill="url(#gradComp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Section>

            <Section delay={0.08}>
              <Box sx={{ ...GLASS, p: 2.5, height: "100%" }}>
                <CardTitle
                  icon={<BugReportIcon />}
                  color="#F87171"
                  title="Vulnerability Distribution"
                  sub={totalVulns > 0 ? `${totalVulns} open findings (latest snapshot)` : "No open findings yet"}
                />
                <Box sx={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {totalVulns === 0 ? (
                    <Stack spacing={1} alignItems="center">
                      <BugReportIcon sx={{ fontSize: 44, color: muted }} />
                      <Typography sx={{ fontSize: 13, color: muted }}>No vulnerabilities to display</Typography>
                    </Stack>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={latestSeverity}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={100}
                          paddingAngle={3}
                          stroke="var(--cardBg)"
                        >
                          {latestSeverity.map((s) => (
                            <Cell key={s.name} fill={SEVERITY_COLOR[s.name]} />
                          ))}
                        </Pie>
                        <RTooltip content={<ChartTip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: secondary }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Box>
            </Section>
          </Box>

          {/* ── Vulnerabilities over time + source contribution ─────────── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
              gap: 2.5,
              mt: 2.5,
            }}
          >
            <Section delay={0.05}>
              <Box sx={{ ...GLASS, p: 2.5, height: "100%" }}>
                <CardTitle
                  icon={<HistoryIcon />}
                  color="#FB923C"
                  title="Vulnerabilities Over Time"
                  sub="Findings by severity across snapshots"
                />
                <Box sx={{ height: 270 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vulnSeries} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid {...GRID} />
                      <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RTooltip content={<ChartTip />} cursor={{ fill: "var(--chartGrid)" }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: secondary }} />
                      <Bar dataKey="critical" name="Critical" stackId="sev" fill="#EF4444" />
                      <Bar dataKey="high" name="High" stackId="sev" fill="#F97316" />
                      <Bar dataKey="medium" name="Medium" stackId="sev" fill="#F59E0B" />
                      <Bar dataKey="low" name="Low" stackId="sev" fill="#22C55E" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Section>

            <Section delay={0.12}>
              <Box sx={{ ...GLASS, p: 2.5, height: "100%" }}>
                <CardTitle
                  icon={<StorageIcon />}
                  color="#34D399"
                  title="Score Contributors"
                  sub="Weighted sources behind your security score"
                />
                {sourceData.length === 0 ? (
                  <Box sx={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 13, color: muted }}>
                      Run scans and complete modules to build your score.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                    {sourceData.map((s) => (
                      <Box key={s.key}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
                          <Typography sx={{ fontSize: 12.5, color: primary, display: "flex", alignItems: "center", gap: 0.8 }}>
                            <Box component="span" sx={{ width: 9, height: 9, borderRadius: 3, bgcolor: s.color }} />
                            {s.name}
                          </Typography>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: primary }}>
                            {Number(s.value).toFixed(1)}%
                          </Typography>
                        </Stack>
                        <Box sx={{ height: 8, borderRadius: 99, bgcolor: "var(--chartGrid)", overflow: "hidden" }}>
                          <Tooltip title={`${s.name}: ${s.value}%`}>
                            <Box
                              sx={{
                                height: "100%",
                                borderRadius: 99,
                                width: `${Math.min(100, s.value)}%`,
                                background: `linear-gradient(90deg, ${s.color}88, ${s.color})`,
                                transition: "width 0.8s ease",
                              }}
                            />
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Section>
          </Box>

          {/* ── Project comparison + AI summary ─────────────────────────── */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, gap: 2.5, mt: 2.5 }}>
            <Section delay={0.08}>
              <Box sx={{ ...GLASS, p: 2.5 }}>
                <CardTitle
                  icon={<FolderOpenIcon />}
                  color="#818CF8"
                  title="Project Comparison"
                  sub={`${comparison.length} project${comparison.length === 1 ? "" : "s"} · sorted by ${sortBy.replace(/_/g, " ")}`}
                />
                {comparison.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <FolderOpenIcon sx={{ fontSize: 44, color: muted }} />
                    <Typography sx={{ fontSize: 13, color: muted, mt: 1 }}>
                      No projects yet — create a project to start monitoring it.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                      <thead>
                        <tr>
                          {["Project", "Security", "Compliance", "Risk", "Open Vulns", "Last Scan"].map((h) => (
                            <th key={h} style={{ textAlign: "left", fontSize: 11.5, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "8px 10px", borderBottom: `1px solid ${divider}` }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.map((c) => {
                          const rc = RISK_COLOR[c.risk_level] || "#64748B";
                          return (
                            <tr key={c.project_id} style={{ borderBottom: `1px solid ${divider}` }}>
                              <td style={{ padding: "11px 10px", fontSize: 13.5, color: primary, fontWeight: 600 }}>
                                {c.name}
                              </td>
                              <td style={{ padding: "11px 10px", fontSize: 13.5, color: "#0284C7", fontWeight: 700 }}>
                                {Number(c.security_score ?? 0).toFixed(1)}%
                              </td>
                              <td style={{ padding: "11px 10px", fontSize: 13.5, color: "#9333EA", fontWeight: 600 }}>
                                {Number(c.compliance_score ?? 0).toFixed(0)}%
                              </td>
                              <td style={{ padding: "11px 10px" }}>
                                <Chip
                                  size="small"
                                  label={c.risk_level}
                                  sx={{ bgcolor: `${rc}22`, color: rc, fontWeight: 700, fontSize: 11, border: `1px solid ${rc}44` }}
                                />
                              </td>
                              <td style={{ padding: "11px 10px", fontSize: 13.5, color: c.open_vulnerabilities > 0 ? "#DC2626" : "#16A34A", fontWeight: 700 }}>
                                {c.open_vulnerabilities ?? 0}
                              </td>
                              <td style={{ padding: "11px 10px", fontSize: 12.5, color: secondary }}>
                                {c.last_scan || "Never"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Box>
                  </Box>
                )}
              </Box>
            </Section>

            <Section delay={0.15}>
              <Box
                sx={{
                  ...GLASS,
                  p: 2.5,
                  height: "100%",
                  background: "linear-gradient(160deg, rgba(99,102,241,0.10) 0%, var(--glassBg) 55%)",
                }}
              >
                <CardTitle
                  icon={<FactCheckIcon />}
                  color="#FBBF24"
                  title="AI Executive Summary"
                  sub="Insights generated from your analytics"
                />
                <Stack spacing={1.8}>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.6 }}>
                      Executive summary
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: primary, lineHeight: 1.65 }}>
                      {ai.executive_summary || "No summary available yet."}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: divider }} />

                  {ai.business_risk && (
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <BusinessIcon sx={{ fontSize: 18, color: "#DC2626", mt: 0.3 }} />
                      <Typography sx={{ fontSize: 12.5, color: secondary, lineHeight: 1.6 }}>
                        <b style={{ color: primary }}>Business risk:</b> {ai.business_risk}
                      </Typography>
                    </Stack>
                  )}

                  {ai.priority_actions?.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: 12, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.8 }}>
                        Priority actions
                      </Typography>
                      <Stack spacing={0.8}>
                        {ai.priority_actions.map((a, i) => (
                          <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                            <Box
                              sx={{
                                mt: 0.4,
                                width: 18,
                                height: 18,
                                borderRadius: 6,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10.5,
                                fontWeight: 800,
                                color: "#0F172A",
                                background: "linear-gradient(135deg,#FBBF24,#F472B6)",
                              }}
                            >
                              {i + 1}
                            </Box>
                            <Typography sx={{ fontSize: 12.5, color: primary, lineHeight: 1.55 }}>{a}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {ai.security_outlook && (
                    <>
                      <Divider sx={{ borderColor: divider }} />
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <TrendingUpIcon sx={{ fontSize: 18, color: "#16A34A", mt: 0.3 }} />
                        <Typography sx={{ fontSize: 12.5, color: secondary, lineHeight: 1.6 }}>
                          <b style={{ color: primary }}>Outlook:</b> {ai.security_outlook}
                        </Typography>
                      </Stack>
                    </>
                  )}
                </Stack>
              </Box>
            </Section>
          </Box>

          {/* ── Recent scan activity ────────────────────────────────────── */}
          {recentScans.length > 0 && (
            <Section delay={0.18}>
              <Box sx={{ ...GLASS, p: 2.5, mt: 2.5 }}>
                <CardTitle
                  icon={<ScheduleIcon />}
                  color="#F472B6"
                  title="Recent Scan Activity"
                  sub="Latest scans from your repositories"
                />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
                  {recentScans.map((s) => {
                    const rc = RISK_COLOR[s.risk] || "#64748B";
                    return (
                      <Box
                        key={s.id}
                        sx={{
                          p: 2,
                          borderRadius: "12px",
                          border: `1px solid ${divider}`,
                          background: "var(--surfaceHover)",
                          transition: "all 0.2s ease",
                          "&:hover": { background: "var(--cardBg)", transform: "translateY(-2px)" },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{ fontSize: 13, fontWeight: 700, color: primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                              {s.repository}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: muted, mt: 0.3 }}>{s.date}</Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={s.risk}
                            sx={{ bgcolor: `${rc}22`, color: rc, fontWeight: 700, fontSize: 10.5, border: `1px solid ${rc}44` }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={3} sx={{ mt: 1.6 }}>
                          <Box>
                            <Typography sx={{ fontSize: 17, fontWeight: 800, color: primary, lineHeight: 1 }}>{s.vulnerabilities}</Typography>
                            <Typography sx={{ fontSize: 10.5, color: muted, mt: 0.4 }}>Vulnerabilities</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 17, fontWeight: 800, color: primary, lineHeight: 1 }}>{s.files}</Typography>
                            <Typography sx={{ fontSize: 10.5, color: muted, mt: 0.4 }}>Files scanned</Typography>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Section>
          )}
        </>
      )}
    </Container>
  );
}
