import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  RefreshCw,
  Shield,
  FolderGit2,
  ScanSearch,
  AlertTriangle,
  Sparkles,
  Trophy,
  GraduationCap,
  Zap,
  Search,
  Activity,
  Target,
  FileText,
  CheckCircle2,
  Flame,
  Flag,
  Database,
  ShieldCheck,
  Bug,
  Compass,
  Brain,
  Lock,
  Medal,
  BadgeCheck,
} from "lucide-react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Tooltip,
  Divider,
  CircularProgress,
  Chip,
  Skeleton,
} from "@mui/material";
import CyberShieldLogo from "../../components/Auth/CyberShieldLogo";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  AreaChart,
  Area,
  Legend,
} from "recharts";

import { keyframes } from "@emotion/react";

import { useTheme } from "../../theme/useTheme";
import { useToast } from "../../components/Animation/ToastProvider";
import { getDashboardOverview } from "../../api/dashboardApi";

/* ── Design tokens ─────────────────────────────────────────────────────── */
const GLASS = {
  background: "var(--glassBg)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--glassBorder)",
  borderRadius: "16px",
  boxShadow: "var(--shadow)",
};

const CARD = {
  ...GLASS,
  padding: 2.5,
};

const GRADIENT = "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const SEVERITY_COLORS = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#10B981",
};

/* ── Small helpers ─────────────────────────────────────────────────────── */
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

function CardHead({ icon, color, title, sub, right }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
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
        {sub && <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>{sub}</Typography>}
      </Box>
      {right}
    </Stack>
  );
}

function SeverityChip({ level }) {
  const normalized = String(level || "low").toLowerCase();
  const color = SEVERITY_COLORS[normalized] || "#64748B";
  return (
    <Chip
      label={String(level || "low").toUpperCase()}
      size="small"
      sx={{
        height: 22,
        fontSize: 10.5,
        fontWeight: 800,
        bgcolor: `${color}1f`,
        color,
      }}
    />
  );
}

/* ── Achievement helpers ────────────────────────────────────────────────── */
const ACHIEVEMENT_STYLES = {
  first_blood: { icon: Flag, color: "#3B82F6", bg: "rgba(59,130,246,0.16)" },
  sql_hunter: { icon: Database, color: "#06B6D4", bg: "rgba(6,182,212,0.16)" },
  xss_defender: { icon: ShieldCheck, color: "#10B981", bg: "rgba(16,185,129,0.16)" },
  injection_master: { icon: Bug, color: "#8B5CF6", bg: "rgba(139,92,246,0.16)" },
  daily_warrior: { icon: Flame, color: "#F59E0B", bg: "rgba(245,158,11,0.16)" },
  cyber_explorer: { icon: Compass, color: "#22C55E", bg: "rgba(34,197,94,0.16)" },
  perfect_defender: { icon: Target, color: "#F43F5E", bg: "rgba(244,63,94,0.16)" },
  ai_learner: { icon: Brain, color: "#A855F7", bg: "rgba(168,85,247,0.16)" },
  quiz_champion: { icon: GraduationCap, color: "#3B82F6", bg: "rgba(59,130,246,0.16)" },
  security_professional: { icon: Shield, color: "#0EA5E9", bg: "rgba(14,165,233,0.16)" },
  streak_master: { icon: Flame, color: "#F97316", bg: "rgba(249,115,22,0.16)" },
  level_10: { icon: Trophy, color: "#EAB308", bg: "rgba(234,179,8,0.16)" },
};

function AchievementIcon({ id, size = 18, unlocked = true }) {
  const style = ACHIEVEMENT_STYLES[id] || { icon: Medal, color: "#64748B", bg: "rgba(100,116,139,0.16)" };
  const Icon = style.icon;
  if (!unlocked) {
    return <Lock size={size} style={{ color: "var(--textMuted)" }} />;
  }
  return <Icon size={size} style={{ color: style.color }} />;
}

function ScoreRing({ value = 0, size = 150, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value)) / 100;
  const color = progress >= 80 ? "#10B981" : progress >= 55 ? "#F59E0B" : "#EF4444";
  const isDark = useTheme().isDark;

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`Security score ${value}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--borderColor)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: isDark ? 34 : 32,
            fontWeight: 800,
            lineHeight: 1,
            color: "var(--textPrimary)",
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </Typography>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5, mt: 0.5 }}>
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

const chartTooltipStyle = {
  background: "var(--glassBg)",
  border: "1px solid var(--borderColor)",
  borderRadius: 12,
  color: "var(--textPrimary)",
  fontSize: 12.5,
  boxShadow: "var(--shadow)",
};

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const result = await getDashboardOverview();
      setData(result);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <Skeleton variant="rounded" width="45%" height={48} sx={{ bgcolor: "var(--borderColor)" }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={140} sx={{ flex: 1, minWidth: 180, bgcolor: "var(--borderColor)" }} />
            ))}
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5}>
            <Skeleton variant="rounded" height={360} sx={{ flex: 1.4, bgcolor: "var(--borderColor)" }} />
            <Skeleton variant="rounded" height={360} sx={{ flex: 1, bgcolor: "var(--borderColor)" }} />
          </Stack>
        </Stack>
      </Container>
    );
  }

  const username =
    data?.username || data?.user?.full_name || "User";
  const stats = data?.stats || {};
  const securityScore = stats.security_score ?? data?.security_score ?? 0;

  const weeklyScans = data?.weekly_scans || [];
  const vulnerabilityTrend = data?.vulnerability_trend || [];
  const achievements = data?.achievements || [];
  const recentActivity = data?.recent_activity || [];
  const aiInsight = data?.ai_insight || null;
  const recentScans = data?.recent_scans || [];
  const recentReports = data?.recent_reports || [];
  const dailyChallenge = data?.daily_challenge || null;
  const learningDetail = data?.learning_progress_detail || null;
  const quizProgress = data?.quiz_progress || null;

  const level = data?.level ?? 1;
  const xp = data?.xp ?? 0;
  const nextLevelXp = data?.next_level_xp ?? 1000;
  const xpProgress = nextLevelXp > 0 ? Math.min(100, Math.round((xp / nextLevelXp) * 100)) : 0;

  const severityData = [
    { name: "Critical", value: data?.critical ?? 0, color: SEVERITY_COLORS.critical },
    { name: "High", value: data?.high ?? 0, color: SEVERITY_COLORS.high },
    { name: "Medium", value: data?.medium ?? 0, color: SEVERITY_COLORS.medium },
    { name: "Low", value: data?.low ?? 0, color: SEVERITY_COLORS.low },
  ];
  const severityTotal = severityData.reduce((sum, s) => sum + (s.value || 0), 0);

  const activityIcon = (type) => {
    switch (String(type || "").toLowerCase()) {
      case "quiz":
        return <GraduationCap size={16} />;
      case "threat":
        return <AlertTriangle size={16} />;
      case "scan":
      default:
        return <Search size={16} />;
    }
  };

  const activityColor = (type) => {
    switch (String(type || "").toLowerCase()) {
      case "quiz":
        return "#8B5CF6";
      case "threat":
        return "#EF4444";
      case "scan":
      default:
        return "#2563EB";
    }
  };

  const statCards = [
    {
      label: "Projects",
      value: data?.projects ?? stats.total_scans ?? 0,
      icon: <FolderGit2 size={20} />,
      color: "#2563EB",
      hint: "Tracked repositories",
    },
    {
      label: "Total Scans",
      value: data?.scans ?? stats.total_scans ?? 0,
      icon: <ScanSearch size={20} />,
      color: "#06B6D4",
      hint: "Repositories scanned",
    },
    {
      label: "Threats",
      value: data?.threats ?? stats.threat_reports ?? 0,
      icon: <AlertTriangle size={20} />,
      color: "#EF4444",
      hint: "Threat reports",
    },
    {
      label: "Quiz Accuracy",
      value: `${stats.quiz_accuracy ?? 0}%`,
      icon: <GraduationCap size={20} />,
      color: "#8B5CF6",
      hint: "Average quiz score",
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Section>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
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
                background:
                  "linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 100%)",
                border: "1px solid rgba(37,99,235,0.25)",
                boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
              }}
            >
              <CyberShieldLogo size={42} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: "var(--textPrimary)" }}>
                Dashboard
              </Typography>
              <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5 }}>
                Welcome back, {username} — here's your security overview.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.2} alignItems="center">
            {data?.rank && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 20,
                  border: "1px solid rgba(234,179,8,0.35)",
                  bgcolor: "rgba(234,179,8,0.12)",
                  color: "#FBBF24",
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <Trophy size={14} />
                {data.rank} · Lv {level}
              </Box>
            )}
            <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              <Box
                component="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 42,
                  height: 42,
                  borderRadius: 2,
                  border: "1px solid var(--glassBorder)",
                  background: "var(--glassBg)",
                  color: "var(--textSecondary)",
                  cursor: "pointer",
                  "&:hover": { background: "var(--surfaceHover)", color: "var(--textPrimary)" },
                }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </Box>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    ...(refreshing ? { animation: `${spin} 1s linear infinite` } : {}),
                  }}
                >
                  <RefreshCw size={17} />
                </Box>
              }
              onClick={() => loadDashboard(true)}
              sx={{
                background: "var(--glassBg)",
                color: "var(--textPrimary)",
                border: "1px solid var(--glassBorder)",
                boxShadow: "none",
                "&:hover": { background: "var(--surfaceHover)" },
              }}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ borderColor: "var(--borderColor)" }} />
      </Section>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <Section delay={0.05}>
          <Box
            sx={{
              mt: 2,
              borderRadius: 2,
              border: "1px solid var(--dangerSoft)",
              bgcolor: "var(--dangerSoft)",
              color: "#EF4444",
              px: 2.5,
              py: 1.5,
              fontSize: 13.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <AlertTriangle size={18} />
            {error}
            <Button size="small" sx={{ ml: "auto", color: "#EF4444", fontWeight: 700 }} onClick={() => loadDashboard()}>
              Retry
            </Button>
          </Box>
        </Section>
      )}

      {/* ── Row: Security score + stat cards ───────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Security score */}
        <Box sx={{ flex: 1.1, minWidth: 0 }}>
          <Section delay={0.05}>
            <Box sx={{ ...CARD, height: "100%", display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
              <ScoreRing value={securityScore} />
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--textPrimary)" }}>
                  Security Score
                </Typography>
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)", mt: 0.5, lineHeight: 1.5 }}>
                  {securityScore >= 80
                    ? "Your security posture is strong. Keep scanning regularly to maintain it."
                    : securityScore >= 55
                      ? "You're on track — reduce high and critical findings to raise your score."
                      : "Your score needs attention. Prioritize critical and high severity issues."}
                </Typography>
                {data?.last_scan_time && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <ScanSearch size={14} style={{ color: "var(--textMuted)" }} />
                    <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>
                      Last scan: {data.last_scan_time}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Box>
          </Section>
        </Box>

        {/* Stat cards */}
        <Box sx={{ flex: 2.4, minWidth: 0 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ height: "100%" }}>
            {statCards.map((card, i) => (
              <Box key={card.label} sx={{ flex: 1, minWidth: 0 }}>
                <Section delay={0.08 + i * 0.05}>
                  <Box sx={CARD}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: `${card.color}1f`,
                          color: card.color,
                          flexShrink: 0,
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, color: "var(--textPrimary)", letterSpacing: "-0.02em" }}>
                          {card.value}
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--textSecondary)" }}>
                          {card.label}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", mt: 1.25, pl: 0.25 }}>
                      {card.hint}
                    </Typography>
                  </Box>
                </Section>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* ── Daily challenge banner ─────────────────────────────────────── */}
      {dailyChallenge && (
        <Section delay={0.12}>
          <Box
            sx={{
              mt: 2.5,
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid var(--glassBorder)",
              background: "linear-gradient(135deg, rgba(124,58,237,0.16) 0%, rgba(37,99,235,0.10) 100%)",
              boxShadow: "var(--shadow)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={2.5}
              sx={{ px: 3, py: 2.5 }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(124,58,237,0.20)",
                  color: "#A78BFA",
                  flexShrink: 0,
                }}
              >
                <Target size={26} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#A78BFA" }}>
                    Daily Challenge
                  </Typography>
                  <SeverityChip level={dailyChallenge.difficulty || "medium"} />
                  {dailyChallenge.completed && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.35,
                        borderRadius: 20,
                        bgcolor: "rgba(16,185,129,0.15)",
                        color: "#34D399",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle2 size={13} />
                      Completed
                    </Box>
                  )}
                </Stack>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: "var(--textPrimary)" }}>
                  {dailyChallenge.title}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.5 }}>
                  {dailyChallenge.description}
                </Typography>
              </Box>
              <Stack direction={{ xs: "row", md: "column" }} spacing={1.25} alignItems={{ xs: "center", md: "flex-end" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 20,
                    bgcolor: "rgba(245,158,11,0.15)",
                    color: "#FBBF24",
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  <Flame size={15} />
                  +{dailyChallenge.reward ?? 50} XP
                </Box>
                <Button
                  component={Link}
                  to="/daily-challenge"
                  variant="contained"
                  sx={{
                    minWidth: 150,
                    textTransform: "none",
                    background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(124,58,237,0.4)",
                    "&:hover": { background: "linear-gradient(135deg, #6D28D9 0%, #1D4ED8 100%)" },
                  }}
                >
                  {dailyChallenge.completed ? "View Challenge" : "Start Challenge"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Section>
      )}

      {/* ── Row: Trend + severity + weekly scans ───────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Vulnerability trend */}
        <Box sx={{ flex: 1.5, minWidth: 0 }}>
          <Section delay={0.1}>
            <Box sx={CARD}>
              <CardHead
                icon={<Zap size={20} />}
                color="#06B6D4"
                title="Vulnerability Trend"
                sub="Weekly severity distribution"
                right={<SeverityChip level={data?.high > 0 ? "high" : "low"} />}
              />
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vulnerabilityTrend} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                    <defs>
                      {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
                        <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid stroke="var(--chartGrid)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--chartLabel)" fontSize={11.5} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--chartLabel)" fontSize={11.5} tickLine={false} axisLine={false} />
                    <ChartTooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--textMuted)" }} iconType="circle" />
                    <Area type="monotone" dataKey="critical" name="Critical" stroke="#EF4444" fillOpacity={1} fill="url(#grad-critical)" strokeWidth={2} />
                    <Area type="monotone" dataKey="high" name="High" stroke="#F59E0B" fillOpacity={1} fill="url(#grad-high)" strokeWidth={2} />
                    <Area type="monotone" dataKey="medium" name="Medium" stroke="#3B82F6" fillOpacity={1} fill="url(#grad-medium)" strokeWidth={2} />
                    <Area type="monotone" dataKey="low" name="Low" stroke="#10B981" fillOpacity={1} fill="url(#grad-low)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Section>
        </Box>

        {/* Weekly scans */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.15}>
            <Box sx={CARD}>
              <CardHead
                icon={<ScanSearch size={20} />}
                color="#2563EB"
                title="Weekly Scans"
                sub="Repositories scanned per day"
              />
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyScans} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                    <defs>
                      <linearGradient id="grad-bar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#2563EB" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--chartGrid)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--chartLabel)" fontSize={11.5} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--chartLabel)" fontSize={11.5} tickLine={false} axisLine={false} />
                    <ChartTooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--surfaceHover)" }} />
                    <Bar dataKey="count" name="Scans" fill="url(#grad-bar)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Row: Severity breakdown + AI insight + learning ────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Severity breakdown */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.15}>
            <Box sx={CARD}>
              <CardHead
                icon={<AlertTriangle size={20} />}
                color="#EF4444"
                title="Severity Breakdown"
                sub="Open issues by severity"
              />
              <Stack spacing={1.5}>
                {severityData.map((sev) => {
                  const pct = severityTotal > 0 ? Math.round((sev.value / severityTotal) * 100) : 0;
                  return (
                    <Box key={sev.name}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "var(--textSecondary)" }}>
                          {sev.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--textPrimary)" }}>
                          {sev.value} · {pct}%
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 8, borderRadius: 99, background: "var(--borderColor)", overflow: "hidden" }}>
                        <Box
                          sx={{
                            height: "100%",
                            width: `${pct}%`,
                            borderRadius: 99,
                            background: sev.color,
                            transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Section>
        </Box>

        {/* AI insight */}
        <Box sx={{ flex: 1.1, minWidth: 0 }}>
          <Section delay={0.2}>
            <Box
              sx={{
                ...CARD,
                height: "100%",
                background: `${aiInsight?.priority === "High" ? "var(--dangerSoft)" : "var(--infoSoft)"}`,
                borderColor: aiInsight?.priority === "High" ? "1px solid #EF444455" : "1px solid #2563EB55",
              }}
            >
              <CardHead
                icon={<Sparkles size={20} />}
                color="#2563EB"
                title="AI Insight"
                sub={aiInsight ? `Priority: ${aiInsight.priority || "Medium"}` : "Personalized guidance"}
              />
              {aiInsight ? (
                <>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--textPrimary)", mb: 1 }}>
                    {aiInsight.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.6 }}>
                    {aiInsight.description}
                  </Typography>
                </>
              ) : (
                <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.6 }}>
                  Run a scan to unlock personalized AI-driven insights about your security posture.
                </Typography>
              )}
            </Box>
          </Section>
        </Box>

        {/* Learning progress + XP */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.25}>
            <Box sx={CARD}>
              <CardHead
                icon={<GraduationCap size={20} />}
                color="#8B5CF6"
                title="Learning Progress"
                sub="Keep building your skills"
              />
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "var(--textSecondary)" }}>
                    Overall progress
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--textPrimary)" }}>
                    {data?.learning_progress ?? 0}%
                  </Typography>
                </Stack>
                <Box sx={{ height: 8, borderRadius: 99, background: "var(--borderColor)", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      width: `${data?.learning_progress ?? 0}%`,
                      borderRadius: 99,
                      background: GRADIENT,
                      transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </Box>
              </Box>

              {(learningDetail?.quiz || learningDetail?.owasp || learningDetail?.glossary) ? (
                <Stack spacing={1.25} sx={{ mb: 1 }}>
                  {[
                    { label: "Quizzes", value: learningDetail.quiz, color: "#8B5CF6" },
                    { label: "OWASP Labs", value: learningDetail.owasp, color: "#06B6D4" },
                    { label: "Glossary", value: learningDetail.glossary, color: "#10B981" },
                  ].map((row) => (
                    <Box key={row.label}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.25 }}>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "var(--textSecondary)" }}>
                          {row.label}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "var(--textPrimary)" }}>
                          {row.value ?? 0}%
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 6, borderRadius: 99, background: "var(--borderColor)", overflow: "hidden" }}>
                        <Box
                          sx={{
                            height: "100%",
                            width: `${row.value ?? 0}%`,
                            borderRadius: 99,
                            background: row.color,
                            transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : null}

              <Divider sx={{ borderColor: "var(--borderColor)", my: 1.5 }} />

              {quizProgress?.completed_quizzes > 0 && (
                <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Attempts
                    </Typography>
                    <Typography sx={{ fontSize: 17, fontWeight: 800, color: "var(--textPrimary)" }}>
                      {quizProgress.completed_quizzes}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Average
                    </Typography>
                    <Typography sx={{ fontSize: 17, fontWeight: 800, color: "var(--textPrimary)" }}>
                      {quizProgress.average_score}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Best
                    </Typography>
                    <Typography sx={{ fontSize: 17, fontWeight: 800, color: "var(--textPrimary)" }}>
                      {quizProgress.highest_score}%
                    </Typography>
                  </Box>
                </Stack>
              )}

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Level {level}
                  </Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 800, color: "var(--textPrimary)" }}>
                    {xp} <Box component="span" sx={{ fontSize: 12, color: "var(--textMuted)", fontWeight: 500 }}>XP</Box>
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                  {nextLevelXp - xp} XP to Lv {level + 1}
                </Typography>
              </Stack>
              <Box sx={{ height: 8, borderRadius: 99, background: "var(--borderColor)", overflow: "hidden", mt: 1 }}>
                <Box
                  sx={{
                    height: "100%",
                    width: `${xpProgress}%`,
                    borderRadius: 99,
                    background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                    transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </Box>
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Row: Achievements + Recent activity ────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Achievements */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.2}>
            <Box sx={CARD}>
              <CardHead
                icon={<Trophy size={20} />}
                color="#F59E0B"
                title="Achievements"
                sub="Milestones from labs, quizzes, streaks and more"
                right={
                  <Stack alignItems="flex-end" spacing={0.5}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--textPrimary)" }}>
                      {achievements.filter((a) => a.unlocked).length}/{achievements.length}
                    </Typography>
                    <Box sx={{ width: 90, height: 6, borderRadius: 99, background: "var(--borderColor)", overflow: "hidden" }}>
                      <Box
                        sx={{
                          height: "100%",
                          width: `${achievements.length ? (achievements.filter((a) => a.unlocked).length / achievements.length) * 100 : 0}%`,
                          borderRadius: 99,
                          background: "linear-gradient(90deg, #F59E0B 0%, #F97316 100%)",
                          transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </Box>
                  </Stack>
                }
              />
              {achievements.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                  Complete scans, quizzes and labs to earn achievements.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {achievements.map((achievement) => {
                    const unlocked = achievement.unlocked;
                    const style =
                      ACHIEVEMENT_STYLES[achievement.id] ||
                      { icon: Medal, color: "#64748B", bg: "rgba(100,116,139,0.16)" };
                    return (
                      <Stack
                        key={achievement.id}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: unlocked ? `${style.color}55` : "var(--borderColor)",
                          background: unlocked ? style.bg : "var(--glassBg)",
                          px: 1.5,
                          py: 1.25,
                          transition: "transform .5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .5s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "var(--shadow)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: unlocked ? style.bg : "var(--borderColor)",
                            color: unlocked ? style.color : "var(--textMuted)",
                            flexShrink: 0,
                          }}
                        >
                          <AchievementIcon id={achievement.id} size={19} unlocked={unlocked} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: unlocked ? "var(--textPrimary)" : "var(--textSecondary)" }}>
                            {achievement.title}
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: unlocked ? style.color : "var(--textMuted)", lineHeight: 1.4 }}>
                            {unlocked ? achievement.description : "Locked — keep learning to unlock it"}
                          </Typography>
                        </Box>
                        {unlocked && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: style.color, flexShrink: 0 }}>
                            <BadgeCheck size={14} />
                            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>Earned</Typography>
                          </Box>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Section>
        </Box>

        {/* Recent activity */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.25}>
            <Box sx={CARD}>
              <CardHead
                icon={<Activity size={20} />}
                color="#22C55E"
                title="Recent Activity"
                sub="What's been happening"
              />
              {recentActivity.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                  No recent activity yet. Start a scan to see it here.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {recentActivity.slice(0, 5).map((item, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: `${activityColor(item.type)}1f`,
                          color: activityColor(item.type),
                          flexShrink: 0,
                        }}
                      >
                        {activityIcon(item.type)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--textPrimary)" }}>
                          {item.title}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                          {item.timestamp || item.time || ""}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Row: Recent scans + recent reports ─────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Recent scans */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.22}>
            <Box sx={CARD}>
              <CardHead
                icon={<ScanSearch size={20} />}
                color="#06B6D4"
                title="Recent Scans"
                sub={`${recentScans.length} scan${recentScans.length === 1 ? "" : "s"} from your history`}
              />
              {recentScans.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                  No scans yet. Run your first repository scan to land on this list.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {recentScans.slice(0, 5).map((scan) => (
                    <Stack key={scan.id} direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(6,182,212,0.15)",
                          color: "#06B6D4",
                          flexShrink: 0,
                        }}
                      >
                        <FolderGit2 size={16} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--textPrimary)" }}>
                          {scan.repository}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                          {scan.date} · {scan.files ?? 0} files · {scan.status || "Completed"}
                        </Typography>
                      </Box>
                      <SeverityChip level={scan.risk_level} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Section>
        </Box>

        {/* Recent threat reports */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.27}>
            <Box sx={CARD}>
              <CardHead
                icon={<FileText size={20} />}
                color="#8B5CF6"
                title="Recent Threat Reports"
                sub={`${recentReports.length} report${recentReports.length === 1 ? "" : "s"} generated`}
              />
              {recentReports.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                  No threat reports yet. Generate one from your projects to track risks.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {recentReports.slice(0, 5).map((report) => (
                    <Stack key={report.id} direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(139,92,246,0.15)",
                          color: "#8B5CF6",
                          flexShrink: 0,
                        }}
                      >
                        <AlertTriangle size={16} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--textPrimary)" }}>
                          {report.project}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                            {report.created}
                          </Typography>
                          {report.score !== undefined && report.score !== null && (
                            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#FBBF24" }}>
                              Score {report.score}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                      <SeverityChip level={report.risk} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <Section delay={0.3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mt: 2.5, px: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Shield size={15} style={{ color: "var(--textMuted)" }} />
            <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>
              Data refreshed {data?.updated_at || "just now"}
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>
            CyberShield Security Monitor
          </Typography>
        </Stack>
      </Section>
    </Container>
  );
}