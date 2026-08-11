import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  CircularProgress,
  Divider,
  MenuItem,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ShieldIcon from "@mui/icons-material/Shield";
import RadarIcon from "@mui/icons-material/Radar";
import BugReportIcon from "@mui/icons-material/BugReport";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SecurityIcon from "@mui/icons-material/Security";
import StorageIcon from "@mui/icons-material/Storage";
import { useTheme } from "../../theme/useTheme";
import {
  getDashboard,
  getDashboardReports,
  getRiskHistory,
} from "../../api/threatDashboardApi";
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
import { severityColor, scoreColor, riskLevelFromScore } from "../../components/ThreatDashboard/severity";
import "./ReportViewer.css";

/* Theme-aware glass card (follows the app's light/dark mode via CSS vars). */
const GLASS = {
  background: "var(--glassBg)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--glassBorder)",
  borderRadius: "14px",
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

function KpiCard({ icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        sx={{
          ...GLASS,
          p: 2.25,
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            minWidth: 42,
            borderRadius: 2.5,
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
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1.1,
              color: "var(--textPrimary)",
            }}
          >
            {value}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: "var(--textMuted)" }}>
            {label}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <Box sx={{ ...GLASS, p: 4, borderRadius: "18px", mb: 3 }}>
        <Box
          sx={{
            height: 180,
            borderRadius: 3,
            background: "linear-gradient(90deg, var(--surfaceHover) 25%, var(--bgSecondary) 50%, var(--surfaceHover) 75%)",
            backgroundSize: "200% 100%",
            animation: "rv-shimmer-border 1.4s infinite",
          }}
        />
      </Box>
      <Grid container spacing={3}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Grid item xs={12} md={6} lg={i < 2 ? 6 : (i < 4 ? 6 : 12)} key={i}>
            <Box
              sx={{
                ...GLASS,
                p: 3,
                minHeight: 260,
                borderRadius: "14px",
              }}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default function ReportViewer() {
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

  const loadReports = useCallback(async () => {
    try {
      const res = await getDashboardReports();
      const list = res.data || [];
      setReports(list);
      return list;
    } catch (e) {
      return [];
    }
  }, []);

  const loadDashboard = useCallback(
    async (rid, isRefresh = false) => {
      if (!rid) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [dash, hist] = await Promise.all([
          getDashboard(rid),
          getRiskHistory(),
        ]);
        setData(dash.data);
        setHistory(hist.data || []);
      } catch (e) {
        setError("Unable to load this threat report. It may have been deleted.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // First mount: resolve the report id if the URL id is not valid.
  useEffect(() => {
    if (id) return;
    (async () => {
      const list = await loadReports();
      if (list.length) {
        setReportId(list[0].report_id);
        navigate(`/threat-reports/${list[0].report_id}`, { replace: true });
      } else {
        setLoading(false);
      }
    })();
  }, [id, loadReports, navigate]);

  // Load dashboard whenever the selected report id changes.
  useEffect(() => {
    if (reportId) loadDashboard(reportId);
  }, [reportId, loadDashboard]);

  const onPick = (value) => {
    setReportId(value);
    navigate(`/threat-reports/${value}`);
  };

  const refresh = () => {
    loadReports();
    if (reportId) loadDashboard(reportId, true);
  };

  const goBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/threat-reports");
  };

  const distribution = data?.distribution || {};
  const threatsFound = [distribution.critical, distribution.high, distribution.medium, distribution.low].reduce((a, b) => (a || 0) + (b || 0), 0);
  const riskColor = data ? scoreColor(data.risk_score ?? 0) : "#64748b";
  const created = useMemo(() => {
    if (!data?.created_at) return null;
    try {
      return new Date(data.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return null;
    }
  }, [data?.created_at]);

  const ThemeColorIcon = isDark ? LightModeIcon : DarkModeIcon;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Back to reports">
            <IconButton
              onClick={goBack}
              sx={{
                border: "1px solid var(--glassBorder)",
                background: "var(--glassBg)",
                color: "var(--textSecondary)",
                "&:hover": { color: "var(--primary)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: "var(--textPrimary)" }}>
              Threat Dashboard
            </Typography>
            <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5 }}>
              {data?.project ? `Security analysis · ${data.project}` : "Interactive threat report analytics"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Report"
            value={reportId}
            onChange={(e) => onPick(e.target.value)}
            sx={{
              minWidth: 220,
              "& .MuiOutlinedInput-root": { background: "var(--cardBg)" },
            }}
          >
            {reports.length === 0 && (
              <MenuItem value="" disabled>
                No reports yet
              </MenuItem>
            )}
            {reports.map((r) => (
              <MenuItem key={r.report_id} value={r.report_id}>
                {r.project}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip title="Refresh data">
            <span>
              <IconButton
                onClick={refresh}
                disabled={refreshing}
                sx={{
                  border: "1px solid var(--glassBorder)",
                  background: "var(--glassBg)",
                  color: "var(--textSecondary)",
                  "&:hover": { color: "var(--primary)" },
                }}
              >
                {refreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              sx={{
                border: "1px solid var(--glassBorder)",
                background: "var(--glassBg)",
                color: "var(--textSecondary)",
                "&:hover": { color: "var(--accentCyan)", transform: "rotate(20deg)" },
                transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <ThemeColorIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && <Section><LoadingSkeleton /></Section>}

      {/* ── Error / empty ──────────────────────────────────────────────── */}
      {!loading && error && (
        <Section>
          <Box
            sx={{
              ...GLASS,
              p: 4,
              textAlign: "center",
              borderColor: "var(--danger)",
            }}
          >
            <SecurityIcon sx={{ fontSize: 44, color: "var(--danger)", mb: 1 }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: "var(--textPrimary)" }}>
              Report unavailable
            </Typography>
            <Typography sx={{ color: "var(--textSecondary)", mt: 0.5, mb: 2 }}>
              {error}
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate("/threat-reports")}>
              Back to reports
            </Button>
          </Box>
        </Section>
      )}

      {!loading && !error && !data && reports.length === 0 && (
        <Section>
          <Box
            sx={{
              ...GLASS,
              p: 6,
              textAlign: "center",
            }}
          >
            <ShieldIcon sx={{ fontSize: 48, color: "var(--primary)", mb: 1.5 }} />
            <Typography variant="h5" fontWeight={800} sx={{ color: "var(--textPrimary)" }}>
              No threat reports yet
            </Typography>
            <Typography sx={{ color: "var(--textSecondary)", mt: 0.5 }}>
              Run a threat analysis to generate interactive security reports.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate("/threat-analysis")}
            >
              Start threat analysis
            </Button>
          </Box>
        </Section>
      )}

      {/* ── Dashboard ──────────────────────────────────────────────────── */}
      {!loading && !error && data && (
        <>
          {/* Hero */}
          <Section>
            <Box
              sx={{
                ...GLASS,
                borderRadius: "18px",
                overflow: "hidden",
                position: "relative",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(1200px 320px at 80% -20%, ${riskColor}26, transparent 60%)`,
                  pointerEvents: "none",
                }}
              />
              <Grid container spacing={3} sx={{ p: 3.5 }}>
                <Grid item xs={12} md={7}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={data.risk_level || riskLevelFromScore(data.risk_score)}
                        icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          bgcolor: `${severityColor(data.risk_level || riskLevelFromScore(data.risk_score))}22`,
                          color: severityColor(data.risk_level || riskLevelFromScore(data.risk_score)),
                          fontWeight: 800,
                          border: `1px solid ${severityColor(data.risk_level || riskLevelFromScore(data.risk_score))}66`,
                        }}
                      />
                      {created && <Chip label={`Run ${created}`} size="small" variant="outlined" sx={{ color: "var(--textSecondary)" }} />}
                    </Stack>
                    <Typography
                      variant="h3"
                      fontWeight={800}
                      sx={{ color: "var(--textPrimary)", letterSpacing: "-0.02em" }}
                    >
                      {data.project}
                    </Typography>
                    <Typography sx={{ color: "var(--textSecondary)", fontSize: 14, maxWidth: 640 }}>
                      Interactive threat model prepared for this project. Explore the STRIDE exposure,
                      OWASP and MITRE mappings, attack surface and prioritized remediation below.
                    </Typography>
                    <Divider sx={{ borderColor: "var(--glassBorder)", my: 0.5 }} />
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Threats found</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--textPrimary)" }}>
                          {data.owasp?.length || 0} categories
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Attack surface</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--textPrimary)" }}>
                          {data.attack_surface?.length || 0} nodes
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Internet facing</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--textPrimary)" }}>
                          {data.executive?.internet_facing ? "Yes" : "No"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Top threat</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--textPrimary)" }}>
                          {data.executive?.top_threat || "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      ...GLASS,
                      borderRadius: "16px",
                      p: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RiskGauge score={data.risk_score} level={data.risk_level} />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Section>

          {/* KPI strip */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <KpiCard icon={<ShieldIcon />} label="Security score" value={`${data.risk_score ?? 0}/100`} color={riskColor} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <KpiCard icon={<BugReportIcon />} label="Vulnerabilities" value={threatsFound} color="#f97316" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <KpiCard icon={<RadarIcon />} label="MITRE techniques" value={data.mitre?.length || 0} color="#a78bfa" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <KpiCard icon={<FactCheckIcon />} label="Recommendations" value={data.recommendations?.length || 0} color="#38bdf8" />
            </Grid>
          </Grid>

          {/* Row 1: Executive summary + risk trend */}
          <Grid container spacing={3} sx={{ mb: 0.5 }}>
            <Grid item xs={12} lg={6}>
              <Section delay={0.05}>
                <ExecutiveSummaryCard
                  executive={data.executive}
                  project={data.project}
                  score={data.risk_score}
                />
              </Section>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Section delay={0.1}>
                <Box sx={{ height: "100%" }}>
                  <RiskTrendChart timeline={[...history].reverse()} />
                </Box>
              </Section>
            </Grid>
          </Grid>

          {/* Row 2: STRIDE + distribution */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.15}>
                <STRIDERadar stride={data.stride} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.2}>
                <RiskPieChart distribution={data.distribution} />
              </Section>
            </Grid>
          </Grid>

          {/* Row 3: Attack surface */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Section delay={0.25}>
                <AttackSurfaceDiagram nodes={data.attack_surface} />
              </Section>
            </Grid>
          </Grid>

          {/* Row 4: OWASP + MITRE */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.3}>
                <OWASPChart owasp={data.owasp} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.35}>
                <MITRETimeline mitre={data.mitre} />
              </Section>
            </Grid>
          </Grid>

          {/* Row 5: Recommendations + comparison */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.4}>
                <RecommendationPanel recommendations={data.recommendations} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.45}>
                <ThreatComparison reports={reports} />
              </Section>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}