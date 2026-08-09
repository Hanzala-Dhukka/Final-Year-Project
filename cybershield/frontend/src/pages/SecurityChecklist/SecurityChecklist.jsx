import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FlagIcon from "@mui/icons-material/Flag";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SpeedIcon from "@mui/icons-material/Speed";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import RadarIcon from "@mui/icons-material/Radar";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HistoryIcon from "@mui/icons-material/History";
import BoltIcon from "@mui/icons-material/Bolt";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import StorageIcon from "@mui/icons-material/Storage";
import GradeIcon from "@mui/icons-material/Grade";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import { useTheme } from "../../theme/useTheme";
import checklistApi from "../../api/checklistApi";
import recommendationApi from "../../api/recommendationApi";
import { projectApi } from "../../api/projectApi";

/* ── Design tokens ─────────────────────────────────────────────────────── */
const SEVERITY_COLOR = {
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#F59E0B",
  Low: "#22C55E",
};

const LEVEL_COLOR = {
  Excellent: "#22C55E",
  Good: "#38BDF8",
  Moderate: "#F59E0B",
  Critical: "#EF4444",
};

const CAT_LEVEL_COLOR = {
  Strong: "#22C55E",
  Adequate: "#38BDF8",
  Weak: "#F59E0B",
  Critical: "#EF4444",
};

const STATUS_META = {
  pending: { label: "Pending", color: "#94A3B8" },
  in_progress: { label: "In Progress", color: "#3B82F6" },
  completed: { label: "Completed", color: "#22C55E" },
};

const CAT_ACCENT = {
  Authentication: "#6366F1",
  Authorization: "#8B5CF6",
  "Input Validation": "#0EA5E9",
  Cryptography: "#F472B6",
  "Secrets Management": "#A855F7",
  Logging: "#F59E0B",
  "Network Security": "#10B981",
  "API Security": "#EC4899",
  "Database Security": "#84CC16",
  "Cloud Security": "#06B6D4",
  "Secure Coding": "#F97316",
};

const ALL_CATEGORIES = [
  "Authentication",
  "Authorization",
  "Input Validation",
  "Cryptography",
  "Secrets Management",
  "Logging",
  "Network Security",
  "API Security",
  "Database Security",
  "Cloud Security",
  "Secure Coding",
];

const GLASS = {
  background: "var(--glassBg)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--glassBorder)",
  borderRadius: "14px",
  boxShadow: "var(--shadow)",
};

function levelFromScore(score) {
  return score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 50 ? "Moderate" : "Critical";
}

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

function CardTitle({ icon, color, title, sub, right }) {  return (
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
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--textPrimary)" }}>
          {title}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>{sub}</Typography>
        )}
      </Box>
      {right}
    </Stack>
  );
}

/* Themed inline chip */
function Chip({ label, color = "#94A3B8", bgcolor, variant = "filled", icon, sx, size = "small" }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        height: size === "large" ? 24 : 21,
        px: 1.1,
        borderRadius: 99,
        fontSize: size === "large" ? 12.5 : 10.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        background: bgcolor || `${color}22`,
        color,
        border: variant === "outlined" ? "1px solid var(--borderColor)" : `1px solid ${color}44`,
        ...sx,
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

function EmptyChart({ label }) {
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
      <RadarIcon sx={{ fontSize: 40, color: "var(--textMuted)" }} />
      <Typography sx={{ fontSize: 12.5, color: "var(--textMuted)", textAlign: "center", px: 2 }}>
        {label}
      </Typography>
    </Box>
  );
}

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
          <Box
            component="span"
            sx={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, bgcolor: p.color, mr: 1 }}
          />
          {p.name}: <b>{Number.isFinite(p.value) ? p.value.toLocaleString() : p.value}</b>
        </Typography>
      ))}
    </Box>
  );
}

const AXIS = { fill: "var(--chartLabel)", fontSize: 11 };
const GRID = { strokeDasharray: "3 3", stroke: "var(--chartGrid)", vertical: false };

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function SecurityChecklist() {
  const { projectId: urlProjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(urlProjectId || "");
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(null);
  const [posture, setPosture] = useState(null);
  const [postureHistory, setPostureHistory] = useState([]);
  const [improvement, setImprovement] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recStats, setRecStats] = useState(null);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [category, setCategory] = useState("All");

  /* Load projects and resolve the initial project id */
  useEffect(() => {
    (async () => {
      try {
        const res = await projectApi.list();
        const list = Array.isArray(res.data) ? res.data : [];
        setProjects(list);
        const stateProjectId = location.state?.projectId;
        const initialId = urlProjectId || stateProjectId || (list.length ? String(list[0].id ?? list[0]._id) : "");
        if (initialId) setProjectId(initialId);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    })();
  }, [urlProjectId, location.state]);

  const loadChecklist = useCallback(async (pid) => {
    if (!pid) return;
    setLoading(true);
    setError("");
    try {
      const [checklistRes, scoreRes] = await Promise.all([
        checklistApi.getProjectChecklists(pid),
        checklistApi.getScore(pid),
      ]);
      setItems(checklistRes.data || []);
      setScore(scoreRes.data);
    } catch (e) {
      console.error("Failed to load checklist", e);
      setError(e.response?.data?.detail || "Failed to load security checklist.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecommendations = useCallback(async (pid) => {
    if (!pid) return;
    setRecLoading(true);
    try {
      const [recRes, statsRes] = await Promise.all([
        recommendationApi.list(pid),
        recommendationApi.stats(pid),
      ]);
      setRecommendations(recRes.data || []);
      setRecStats(statsRes.data);
    } catch (e) {
      console.warn("Failed to load scanner recommendations:", e);
    } finally {
      setRecLoading(false);
    }
  }, []);

  const loadPosture = useCallback(async (pid) => {
    if (!pid) return;
    try {
      const res = await checklistApi.getSecurityPosture(pid);
      setPosture(res.data);
    } catch (e) {
      console.warn("Failed to load security posture:", e);
    }
  }, []);

  const loadHistory = useCallback(async (pid) => {
    if (!pid) return;
    try {
      const [histRes, impRes, shRes] = await Promise.all([
        checklistApi.getPostureHistory(pid, 30),
        checklistApi.getImprovement(pid),
        checklistApi.getScoreHistory(pid, 30),
      ]);
      setPostureHistory(Array.isArray(histRes.data) ? histRes.data : []);
      setImprovement(impRes.data);
      setScoreHistory(Array.isArray(shRes.data) ? shRes.data : []);
    } catch (e) {
      console.warn("Failed to load improvement / history data:", e);
    }
  }, []);

  useEffect(() => {
    loadChecklist(projectId);
    loadRecommendations(projectId);
    loadPosture(projectId);
    loadHistory(projectId);
  }, [projectId, loadChecklist, loadRecommendations, loadPosture, loadHistory]);

  const reloadAll = useCallback(() => {
    loadChecklist(projectId);
    loadRecommendations(projectId);
    loadPosture(projectId);
    loadHistory(projectId);
  }, [projectId, loadChecklist, loadRecommendations, loadPosture, loadHistory]);

  /* Generate a project checklist from the hardening catalogue */
  const generate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError("");
    try {
      await checklistApi.generateChecklist(projectId, {});
      loadChecklist(projectId);
      loadPosture(projectId);
      loadHistory(projectId);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to generate checklist.");
    } finally {
      setGenerating(false);
    }
  };

  /* Toggle a task's completion (optimistic) */
  const toggle = async (item) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    const prev = items;
    setItems((cur) =>
      cur.map((it) =>
        it.checklist_id === item.checklist_id ? { ...it, status: newStatus } : it
      )
    );
    try {
      await checklistApi.updateStatus(item.checklist_id, projectId, newStatus);
      const scoreRes = await checklistApi.getScore(projectId);
      setScore(scoreRes.data);
      loadRecommendations(projectId);
      loadPosture(projectId);
      if (newStatus === "completed") {
        checklistApi.trackCompletion(projectId).catch(() => {});
      }
      loadHistory(projectId);
    } catch (e) {
      setItems(prev);
      setError(e.response?.data?.detail || "Failed to update status.");
    }
  };

  /* Filtering + derived views */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const sevOk = severity === "All" || it.severity === severity;
      const catOk = category === "All" || it.category === category;
      const qOk = !q || (it.title + " " + it.description).toLowerCase().includes(q);
      return sevOk && catOk && qOk;
    });
  }, [items, severity, category, query]);

  const categories = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    return ALL_CATEGORIES.filter((c) => present.has(c));
  }, [items]);

  const taskCounts = useMemo(() => {
    const counts = { total: items.length, completed: 0, in_progress: 0, pending: 0 };
    items.forEach((i) => {
      if (i.status === "completed") counts.completed += 1;
      else if (i.status === "in_progress") counts.in_progress += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [items]);

  const completedBySeverity = useMemo(() => {
    const map = {};
    items.forEach((i) => {
      if (i.status === "completed") map[i.severity] = (map[i.severity] || 0) + 1;
    });
    return map;
  }, [items]);

  const totalBySeverity = useMemo(() => {
    const map = {};
    items.forEach((i) => {
      map[i.severity] = (map[i.severity] || 0) + 1;
    });
    return map;
  }, [items]);

  const aiTasks = useMemo(() => items.filter((t) => t.recommended || t.matched_rule || t.scan_id), [items]);

  /* Effective posture (posture API preferred; graceful fallback to score) */
  const effScore = posture?.score ?? score?.score ?? 0;
  const effLevel = posture?.level || (score?.score != null ? levelFromScore(score.score) : "Critical");
  const effCompleted = posture?.completed_tasks ?? score?.completed_tasks ?? 0;
  const effTotal = posture?.total_tasks ?? score?.total_tasks ?? items.length;
  const riskTotal = posture?.total_risk ?? 0;
  const riskReduced = posture?.risk_reduced ?? 0;
  const riskRemaining = posture?.risk_remaining ?? Math.max(0, riskTotal - riskReduced);

  const categoryRows = useMemo(() => {
    if (posture?.category_details?.length) {
      return posture.category_details.map((c) => ({
        category: c.category,
        score: Number(c.score ?? 0),
        level: c.level || "Weak",
        weight: c.risk_weight ?? 5,
      }));
    }
    return (score?.by_category || []).map((c) => ({
      category: c.category,
      score: Number(c.score ?? 0),
      level: c.score >= 80 ? "Strong" : c.score >= 60 ? "Adequate" : "Weak",
      weight: 5,
    }));
  }, [posture, score]);

  const trendData = useMemo(
    () =>
      postureHistory
        .slice()
        .reverse()
        .map((h) => ({
          date: h.created_at ? new Date(h.created_at).toLocaleDateString() : "—",
          security_score: Number(h.security_score ?? 0),
        })),
    [postureHistory]
  );

  const scoreHistoryData = useMemo(
    () =>
      scoreHistory
        .slice()
        .reverse()
        .map((h) => ({
          date: h.created_at ? new Date(h.created_at).toLocaleDateString() : "—",
          score: Number(h.score ?? 0),
          risk_reduced: Number(h.risk_reduced ?? 0),
        })),
    [scoreHistory]
  );

  const primary = "var(--textPrimary)";
  const secondary = "var(--textSecondary)";
  const muted = "var(--textMuted)";
  const divider = "var(--borderColor)";
  const levelColor = LEVEL_COLOR[effLevel] || "#64748B";

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
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
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 55%, #EC4899 100%)",
                color: "#fff",
                boxShadow: "0 10px 30px rgba(124,58,237,0.45)",
              }}
            >
              <LockIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: primary }}>
                Security Hardening
              </Typography>
              <Typography sx={{ color: secondary, fontSize: 13.5 }}>
                Risk-weighted posture, automated hardening tasks and scanner-driven recommendations.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems="stretch">
            {/* Light / dark mode toggle */}
            <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              <Box
                component="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 42,
                  height: 42,
                  borderRadius: 2,
                  border: "1px solid var(--glassBorder)",
                  background: "var(--glassBg)",
                  color: secondary,
                  cursor: "pointer",
                  "&:hover": { background: "var(--surfaceHover)", color: primary },
                }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </Box>
            </Tooltip>

            <Box sx={{ minWidth: { xs: "100%", sm: 210 } }}>
              <TextField
                select
                size="small"
                fullWidth
                value={projectId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setProjectId(newId);
                  if (newId) navigate(`/security-checklist/${newId}`, { replace: true });
                }}
                InputProps={{
                  sx: {
                    color: primary,
                    background: "var(--glassBg)",
                    "& .MuiSelect-icon": { color: secondary },
                  },
                }}
                InputLabelProps={{ sx: { color: secondary } }}
              >
                {projects.length === 0 && <MenuItem value="">No projects</MenuItem>}
                {projects.map((p) => (
                  <MenuItem key={p.id ?? p._id} value={String(p.id ?? p._id)}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={reloadAll}
              disabled={loading || !projectId}
              sx={{
                background: "var(--glassBg)",
                color: primary,
                border: "1px solid var(--glassBorder)",
                boxShadow: "none",
                "&:hover": { background: "var(--surfaceHover)" },
              }}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <GradeIcon />}
              onClick={generate}
              disabled={generating || !projectId}
              sx={{
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                "&:hover": { filter: "brightness(1.08)" },
              }}
            >
              {generating ? "Generating..." : "Generate Checklist"}
            </Button>
          </Stack>
        </Stack>
      </Section>

      {/* Error banner */}
      {error && (
        <AlertSeverityBar message={error} />
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography sx={{ color: secondary }}>Loading hardening posture...</Typography>
          </Stack>
        </Box>
      ) : (
        <>
          {/* ── Posture hero row (SC4) ───────────────────────────────────── */}
          <Section>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "repeat(4, 1fr)" },
                gap: 2.5,
              }}
            >
              {/* Security score gauge */}
              <Box
                sx={{
                  ...GLASS,
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  background: `linear-gradient(135deg, ${levelColor}22 0%, var(--glassBg) 60%)`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <SpeedIcon sx={{ color: levelColor, fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Security Score
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      width: 112,
                      height: 112,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `conic-gradient(${levelColor} ${Math.max(3, effScore * 3.6)}deg, var(--chartGrid) 0deg)`,
                      boxShadow: `0 0 24px ${levelColor}33`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 82,
                        height: 82,
                        borderRadius: "50%",
                        background: "var(--glassBg)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ fontSize: 26, fontWeight: 900, color: primary, lineHeight: 1.1 }}>
                        {Number(effScore).toFixed(1)}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: muted, fontWeight: 600 }}>/ 100</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Chip
                      size="small"
                      label={effLevel || "Unknown"}
                      sx={{
                        bgcolor: `${levelColor}26`,
                        color: levelColor,
                        fontWeight: 700,
                        border: `1px solid ${levelColor}55`,
                      }}
                    />
                    <Typography sx={{ fontSize: 12, color: muted, mt: 1 }}>
                      <b style={{ color: secondary }}>{effCompleted}</b> of {effTotal} tasks done
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Risk coverage */}
              <Box sx={{ ...GLASS, p: 2.5, display: "flex", flexDirection: "column", gap: 1.4 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ShieldOutlinedIcon sx={{ color: "#38BDF8", fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Risk Coverage
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Box>
                    <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: "#38BDF8" }}>
                      {riskReduced}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.5 }}>Risk points covered</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: primary }}>
                      {riskRemaining}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.5 }}>Remaining</Typography>
                  </Box>
                </Stack>
                <Box sx={{ height: 8, borderRadius: 99, bgcolor: "var(--chartGrid)", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: 99,
                      width: `${riskTotal ? Math.min(100, (riskReduced / riskTotal) * 100) : 0}%`,
                      background: "linear-gradient(90deg,#38BDF8,#6366F1)",
                      transition: "width 0.8s ease",
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 11, color: muted }}>
                  Weighted by severity — {riskTotal || 0} total risk points
                </Typography>
              </Box>

              {/* Hardening progress */}
              <Box sx={{ ...GLASS, p: 2.5, display: "flex", flexDirection: "column", gap: 1.4 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FactCheckIcon sx={{ color: "#C084FC", fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Hardening Progress
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2.5}>
                  <Box>
                    <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: primary }}>
                      {taskCounts.completed}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.5 }}>Completed</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: "#3B82F6" }}>
                      {taskCounts.in_progress}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.5 }}>In progress</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: "#94A3B8" }}>
                      {taskCounts.pending}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.5 }}>Pending</Typography>
                  </Box>
                </Stack>
                <Typography sx={{ fontSize: 11, color: muted }}>
                  {taskCounts.total} hardening tasks across {categories.length} categories
                </Typography>
              </Box>

              {/* Severity breakdown */}
              <Box sx={{ ...GLASS, p: 2.5, display: "flex", flexDirection: "column", gap: 1.3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FlagIcon sx={{ color: "#F87171", fontSize: 22 }} />
                  <Typography sx={{ fontSize: 12, color: secondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Severity Focus
                  </Typography>
                </Stack>
                {["Critical", "High", "Medium", "Low"].map((sev) => {
                  const total = totalBySeverity[sev] || 0;
                  const done = completedBySeverity[sev] || 0;
                  const color = SEVERITY_COLOR[sev];
                  return (
                    <Stack key={sev} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: 3, bgcolor: color }} />
                        <Typography sx={{ fontSize: 12, color: primary }}>{sev}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: primary }}>
                        {done}<Box component="span" sx={{ color: muted, fontWeight: 500 }}>/{total}</Box>
                      </Typography>
                    </Stack>
                  );
                })}
                <Typography sx={{ fontSize: 11, color: muted, mt: 0.5 }}>
                  Completed / total per severity weight
                </Typography>
              </Box>
            </Box>
          </Section>

          {/* ── Posture trend + category coverage ──────────────────────── */}
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
                  icon={<RadarIcon />}
                  color="#38BDF8"
                  title="Posture Trend"
                  sub="Risk-weighted security score over time"
                  right={
                    trendData.length >= 2 && (
                      <Chip
                        size="small"
                        label={`${trendData[trendData.length - 1].security_score - trendData[0].security_score >= 0 ? "+" : ""}${(
                          trendData[trendData.length - 1].security_score - trendData[0].security_score
                        ).toFixed(1)}`}
                        sx={{
                          bgcolor: trendData[trendData.length - 1].security_score >= trendData[0].security_score ? "rgba(16,185,129,0.14)" : "rgba(239,68,68,0.14)",
                          color: trendData[trendData.length - 1].security_score >= trendData[0].security_score ? "#16A34A" : "#DC2626",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                    )
                  }
                />
                <Box sx={{ height: 270 }}>
                  {trendData.length === 0 ? (
                    <EmptyChart label="No posture snapshots yet — toggle a task to start tracking." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradPosture" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...GRID} />
                        <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} />
                        <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <RTooltip content={<ChartTip />} />
                        <Area
                          type="monotone"
                          dataKey="security_score"
                          name="Security Posture"
                          stroke="#38BDF8"
                          strokeWidth={2.5}
                          fill="url(#gradPosture)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Box>
            </Section>

            <Section delay={0.08}>
              <Box sx={{ ...GLASS, p: 2.5, height: "100%" }}>
                <CardTitle
                  icon={<StorageIcon />}
                  color="#C084FC"
                  title="Category Coverage"
                  sub="Security level by hardening category"
                />
                {categoryRows.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <FactCheckIcon sx={{ fontSize: 42, color: muted }} />
                    <Typography sx={{ fontSize: 13, color: muted, mt: 1 }}>
                      Generate or complete tasks to build category coverage.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.7 }}>
                    {categoryRows.map((c) => {
                      const color = CAT_LEVEL_COLOR[c.level] || "#64748B";
                      return (
                        <Box key={c.category}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography sx={{ fontSize: 12.5, color: primary, display: "flex", alignItems: "center", gap: 0.8 }}>
                              <Box sx={{ width: 9, height: 9, borderRadius: 3, bgcolor: CAT_ACCENT[c.category] || "#94A3B8" }} />
                              {c.category}
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: color }}>
                              {Number(c.score).toFixed(0)}%
                            </Typography>
                          </Stack>
                          <Box sx={{ height: 8, borderRadius: 99, bgcolor: "var(--chartGrid)", overflow: "hidden" }}>
                            <Box
                              sx={{
                                height: "100%",
                                borderRadius: 99,
                                width: `${Math.min(100, c.score)}%`,
                                background: `linear-gradient(90deg, ${color}88, ${color})`,
                                transition: "width 0.8s ease",
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Section>
          </Box>

          {/* ── Improvement (SC5) + AI recommendations ─────────────────── */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, gap: 2.5, mt: 2.5 }}>
            <Section delay={0.05}>
              <Box sx={{ ...GLASS, p: 2.5 }}>
                <CardTitle
                  icon={<TrendingUpIcon />}
                  color="#34D399"
                  title="Goal Score Improvement"
                  sub="Track how hardening raises your score over time"
                />
                {improvement?.has_data ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr 1fr", sm: "auto 1fr auto" },
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <ScorePill label="Before" value={improvement.old_score} level={improvement.old_level} up={false} />
                      <Stack direction="row" justifyContent="center">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <KeyboardArrowRightIcon sx={{ color: secondary }} />
                          <Box sx={{ textAlign: "center" }}>
                            <Typography sx={{ fontSize: 24, fontWeight: 900, color: improvement.improvement >= 0 ? "#16A34A" : "#DC2626", lineHeight: 1 }}>
                              {improvement.improvement >= 0 ? "+" : ""}
                              {Number(improvement.improvement).toFixed(1)}
                            </Typography>
                            <Typography sx={{ fontSize: 10.5, color: muted }}>points</Typography>
                          </Box>
                          <KeyboardArrowRightIcon sx={{ color: secondary }} />
                        </Box>
                      </Stack>
                      <ScorePill label="After" value={improvement.new_score} level={improvement.new_level} />
                    </Box>
                    <Divider sx={{ borderColor: divider }} />
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                      <MiniStat label="Tasks completed" value={improvement.tasks_completed} color="#16A34A" />
                      <MiniStat label="Snapshots tracked" value={improvement.history_count} color="#38BDF8" />
                    </Stack>
                    <Box sx={{ height: 190 }}>
                      {scoreHistoryData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={scoreHistoryData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34D399" stopOpacity={0.45} />
                                <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid {...GRID} />
                            <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={AXIS} axisLine={false} tickLine={false} />
                            <RTooltip content={<ChartTip />} />
                            <Area type="monotone" dataKey="score" name="Security Score" stroke="#34D399" strokeWidth={2.5} fill="url(#gradScore)" />
                            <Area type="monotone" dataKey="risk_reduced" name="Risk Reduced" stroke="#38BDF8" strokeWidth={1.6} fill="none" strokeDasharray="4 3" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <TrendingUpIcon sx={{ fontSize: 40, color: muted }} />
                          <Typography sx={{ fontSize: 12.5, color: muted, mt: 1 }}>
                            Complete tasks to record score snapshots and watch your posture climb.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <HistoryIcon sx={{ fontSize: 44, color: muted }} />
                    <Typography sx={{ fontSize: 13, color: muted, mt: 1 }}>
                      No improvement data yet — complete a task to start tracking your score.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Section>

            <Section delay={0.12}>
              <Box
                sx={{
                  ...GLASS,
                  p: 2.5,
                  height: "100%",
                  background: "linear-gradient(160deg, rgba(99,102,241,0.12) 0%, var(--glassBg) 55%)",
                }}
              >
                <CardTitle
                  icon={<BoltIcon />}
                  color="#FBBF24"
                  title="Scanner-Priority Tasks"
                  sub="Hardening tasks flagged by your GitHub scans"
                />
                {aiTasks.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <BoltIcon sx={{ fontSize: 42, color: muted }} />
                    <Typography sx={{ fontSize: 13, color: muted, mt: 1 }}>
                      Run the GitHub scanner — tasks matched by scan rules will be flagged here for quick triage.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                    {aiTasks.map((t) => (
                      <Box
                        key={t.checklist_id + t.scan_id}
                        sx={{
                          p: 1.6,
                          borderRadius: 2,
                          border: "1px solid var(--glassBorder)",
                          background: "var(--surfaceHover)",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <Box sx={{ mt: 0.4, width: 20, height: 20, borderRadius: 6.5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#0F172A", background: "linear-gradient(135deg,#FBBF24,#F472B6)", fontSize: 10, fontWeight: 800 }}>
                            {String(t.impact_score ?? t.severity ?? "?")}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: primary, lineHeight: 1.45 }}>
                              {t.title || t.task}
                            </Typography>
                            <Stack direction="row" spacing={0.8} sx={{ mt: 0.6 }}>
                              <Chip size="small" label={t.severity} sx={{ bgcolor: `${SEVERITY_COLOR[t.severity] || "#94A3B8"}26`, color: SEVERITY_COLOR[t.severity] || "#94A3B8", fontWeight: 700, fontSize: 10.5, border: `1px solid ${SEVERITY_COLOR[t.severity] || "#94A3B8"}44` }} />
                              <Chip size="small" label={t.source || "Scan"} sx={{ bgcolor: "rgba(251,191,36,0.14)", color: "#B45309", fontWeight: 700, fontSize: 10.5 }} />
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Section>
          </Box>

          {/* ── Scanner recommendations (SC3) ─────────────────────────── */}
          {recStats?.total > 0 && (
            <Section delay={0.1}>
              <Box sx={{ ...GLASS, p: 2.5, mt: 2.5 }}>
                <CardTitle
                  icon={<FlagIcon />}
                  color="#F472B6"
                  title="Scanner Recommendations (SC3)"
                  sub={`${recStats.total} recommended hardening tasks from your scans`}
                  right={
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`${recStats.pending} pending`} sx={{ bgcolor: "rgba(244,114,182,0.14)", color: "#DB2777", fontWeight: 700, fontSize: 11 }} />
                      <Chip size="small" label={`${recStats.completed} done`} sx={{ bgcolor: "rgba(16,185,129,0.14)", color: "#16A34A", fontWeight: 700, fontSize: 11 }} />
                    </Stack>
                  }
                />
                {recStats?.by_severity && Object.keys(recStats.by_severity).length > 0 && (
                  <Stack direction="row" gap={1} sx={{ mb: 2 }}>
                    {Object.entries(recStats.by_severity).map(([sev, count]) => (
                      <Chip
                        key={sev}
                        size="small"
                        label={`${sev} · ${count}`}
                        icon={<ErrorOutlineIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          bgcolor: `${SEVERITY_COLOR[sev] || "#94A3B8"}22`,
                          color: SEVERITY_COLOR[sev] || "#64748B",
                          fontWeight: 700,
                          fontSize: 11,
                          border: `1px solid ${SEVERITY_COLOR[sev] || "#94A3B8"}44`,
                        }}
                      />
                    ))}
                  </Stack>
                )}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
                  {recommendations.slice(0, 9).map((r, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.8,
                        borderRadius: 2,
                        border: "1px solid var(--borderColor)",
                        background: "var(--surfaceHover)",
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Chip size="small" label={r.category || "General"} color={secondary} bgcolor="rgba(148,163,184,0.14)" />
                        <Chip size="small" label={r.severity} sx={{ bgcolor: `${SEVERITY_COLOR[r.severity] || "#94A3B8"}26`, color: SEVERITY_COLOR[r.severity] || "#94A3B8", fontWeight: 700, fontSize: 10.5 }} />
                      </Stack>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: primary, mt: 1.2, lineHeight: 1.5 }}>
                        {r.task || r.checklist_rule}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: muted, mt: 0.6, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {r.linked_finding || r.checklist_rule}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Section>
          )}

          {/* ── Tasks ─────────────────────────────────────────────────── */}
          <Section delay={0.15}>
            <Box sx={{ ...GLASS, p: 2.5, mt: 2.5 }}>
              <CardTitle
                icon={<FactCheckIcon />}
                color="#818CF8"
                title="Hardening Tasks"
                sub={`${visible.length} of ${items.length} tasks shown · toggle a task to update posture & score`}
              />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "240px 1fr" }, gap: 2 }}>
                {/* Filters */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6 }}>
                  <TextField
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tasks..."
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: secondary, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: primary,
                        background: "var(--bgSecondary)",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--borderColor)" },
                      },
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontSize: 11, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.6 }}>
                      Severity
                    </Typography>
                    <Stack spacing={0.6}>
                      {["All", "Critical", "High", "Medium", "Low"].map((sev) => {
                        const sc = sev === "All" ? "#94A3B8" : SEVERITY_COLOR[sev];
                        return (
                          <button
                            key={sev}
                            onClick={() => setSeverity(sev)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: severity === sev ? `1px solid ${sc}55` : "1px solid transparent",
                              background: severity === sev ? `${sc}1c` : "transparent",
                              color: severity === sev ? "var(--textPrimary)" : "var(--textSecondary)",
                              fontSize: 12.5,
                              fontWeight: severity === sev ? 700 : 500,
                              cursor: "pointer",
                            }}
                          >
                            <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: 3, bgcolor: sc }} />
                              {sev}
                            </Box>
                            <Box
                              component="span"
                              sx={{
                                fontSize: 10,
                                fontWeight: 700,
                                px: 0.6,
                                py: 0.1,
                                borderRadius: 6,
                                background: `${sc}1f`,
                                color: sc,
                              }}
                            >
                              {sev === "All" ? items.length : totalBySeverity[sev] || 0}
                            </Box>
                          </button>
                        );
                      })}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.6 }}>
                      Category
                    </Typography>
                    <Stack spacing={0.6}>
                      {["All", ...categories].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          style={{
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid transparent",
                            background: category === cat ? "var(--surfaceHover)" : "transparent",
                            color: category === cat ? "var(--textPrimary)" : "var(--textSecondary)",
                            fontSize: 12.5,
                            fontWeight: category === cat ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          <Box sx={{ width: 8, height: 8, borderRadius: 3, bgcolor: CAT_ACCENT[cat] || "#94A3B8" }} />
                          {cat}
                        </button>
                      ))}
                    </Stack>
                  </Box>
                </Box>

                {/* Task cards */}
                <Box>
                  {loading ? (
<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8, color: secondary, gap: 1.5, fontSize: 13.5 }}>
  <RefreshIcon sx={{ fontSize: 18 }} />
  Loading checklist...
</Box>
                  ) : visible.length === 0 ? (
                    <EmptyTasks
                      hasProjects={projects.length > 0}
                      hasItems={items.length > 0}
                      onNavigate={() => navigate("/projects")}
                      onGenerate={generate}
                    />
                  ) : (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.8 }}>
                      {visible.map((it) => {
                        const sevColor = SEVERITY_COLOR[it.severity] || "#94A3B8";
                        const statusMeta = STATUS_META[it.status] || STATUS_META.pending;
                        const isDone = it.status === "completed";
                        return (
                          <Box
                            key={it.checklist_id}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: "1px solid var(--borderColor)",
                              background: isDone ? "rgba(16,185,129,0.05)" : "var(--surfaceHover)",
                              opacity: isDone ? 0.88 : 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              transition: "all 0.25s ease",
                              "&:hover": { transform: "translateY(-2px)", borderColor: `var(--border-strong)` },
                            }}
                          >
                            <Stack direction="row" spacing={1.2} alignItems="flex-start">
                              <Tooltip title={isDone ? "Mark as pending" : "Mark as completed"}>
                                <button
                                  onClick={() => toggle(it)}
                                  aria-label={isDone ? "Mark pending" : "Mark completed"}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    color: isDone ? "#22C55E" : "var(--textMuted)",
                                    marginTop: 2,
                                  }}
                                >
                                  {isDone ? (
                                    <CheckCircleIcon sx={{ fontSize: 24 }} />
                                  ) : (
                                    <RadioButtonUncheckedIcon sx={{ fontSize: 24 }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: primary, lineHeight: 1.4 }}>
                                  {it.title}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: secondary, lineHeight: 1.55, mt: 0.4 }}>
                                  {it.description}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 0.5 }}>
                              <Chip size="small" label={it.category} color={CAT_ACCENT[it.category] || secondary} bgcolor={`${CAT_ACCENT[it.category] || "#94A3B8"}1c`} />
                              <Chip size="small" label={it.severity} sx={{ bgcolor: `${sevColor}22`, color: sevColor, fontWeight: 700, fontSize: 10.5, border: `1px solid ${sevColor}44` }} />
                              <Chip size="small" label={statusMeta.label} sx={{ bgcolor: `${statusMeta.color}22`, color: statusMeta.color, fontWeight: 700, fontSize: 10.5 }} />
                              {Array.isArray(it.frameworks) &&
                                it.frameworks.slice(0, 2).map((fw) => (
                                  <Chip key={fw} size="small" variant="outlined" label={fw} sx={{ fontSize: 10, color: muted, borderColor: "var(--borderColor)" }} />
                                ))}
                              {it.matched_rule && (
                                <Chip size="small" label="scan" sx={{ bgcolor: "rgba(59,130,246,0.14)", color: "#3B82F6", fontWeight: 700, fontSize: 10 }} />
                              )}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Section>
        </>
      )}
    </Container>
  );
}

/* ── Small helper components (theme-aware) ─────────────────────────────── */
function AlertSeverityBar({ message }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        px: 2,
        py: 1.4,
        mb: 2,
        borderRadius: 2,
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.35)",
        color: "#FCA5A5",
        fontSize: 13,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 18 }} />
      {message}
    </Box>
  );
}

function ScorePill({ label, value, level, color }) {
  const c = LEVEL_COLOR[level] || color || "#94A3B8";
  return (
    <Box sx={{ p: 1.6, borderRadius: 2, border: "1px solid var(--glassBorder)", background: "var(--surfaceHover)", minWidth: 132 }}>
      <Typography sx={{ fontSize: 10.5, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 900, color: c, lineHeight: 1.15 }}>{Number(value ?? 0).toFixed(1)}%</Typography>
      <Typography sx={{ fontSize: 11, color: "var(--textSecondary)" }}>{level || "—"}</Typography>
    </Box>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 19, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</Typography>
      <Typography sx={{ fontSize: 11, color: "var(--textMuted)" }}>{label}</Typography>
    </Box>
  );
}

function EmptyTasks({ hasProjects, hasItems, onNavigate }) {
  return (
    <Box
      sx={{
        py: 8,
        textAlign: "center",
        border: "1px dashed var(--borderColor)",
        borderRadius: 2,
        background: "var(--surfaceHover)",
      }}
    >
      {!hasProjects ? (
        <>
          <AddIcon sx={{ fontSize: 48, color: "var(--textMuted)", mb: 1 }} />
          <Typography sx={{ fontWeight: 700, color: "var(--textPrimary)", fontSize: 15 }}>No projects yet</Typography>
          <Typography sx={{ color: "var(--textSecondary)", fontSize: 13, mt: 0.5, mb: 2 }}>
            Create a project first to generate a security checklist.
          </Typography>
          <Button variant="outlined" onClick={() => onNavigate("/projects")}>Go to Projects</Button>
        </>
      ) : (
        <>
          <FactCheckIcon sx={{ fontSize: 48, color: "var(--textMuted)", mb: 1 }} />
          <Typography sx={{ fontWeight: 700, color: "var(--textPrimary)", fontSize: 15 }}>No tasks found</Typography>
          <Typography sx={{ color: "var(--textSecondary)", fontSize: 13, mt: 0.5 }}>
            {!hasItems
              ? 'Click "Generate Checklist" to seed security hardening requirements for this project.'
              : "No tasks match your current filters. Try adjusting the filters above."}
          </Typography>
        </>
      )}
    </Box>
  );
}