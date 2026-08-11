import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  RefreshCw,
  Shield,
  Target,
  Flame,
  Trophy,
  Zap,
  Clock,
  Lightbulb,
  CheckCircle2,
  XCircle,
  History,
  CalendarDays,
  Medal,
  Award,
  BookOpen,
  Sparkles,
  ChevronDown,
  Send,
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
import { keyframes } from "@emotion/react";
import { useTheme } from "../../theme/useTheme";
import { useToast } from "../../components/Animation/ToastProvider";
import CyberShieldLogo from "../../components/Auth/CyberShieldLogo";
import {
  getTodaysChallenge,
  submitChallenge,
  getChallengeHistory,
  getUserStreak,
  getChallengeStatistics,
  getChallengeCalendar,
  getChallengeLeaderboard,
  getUserId,
} from "../../api/dailyChallengeApi";

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

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const DIFFICULTY_COLORS = {
  easy: "#10B981",
  medium: "#F59E0B",
  hard: "#EF4444",
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

function CardHead({ icon, color, title, sub, right, lightBg }) {
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
          bgcolor: lightBg ? `${color}1f` : `var(--infoSoft)`,
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

function DifficultyBadge({ level }) {
  const normalized = String(level || "medium").toLowerCase();
  const color = DIFFICULTY_COLORS[normalized] || "#64748B";
  return (
    <Chip
      label={String(level || "Medium").toUpperCase()}
      size="small"
      sx={{ height: 22, fontSize: 10.5, fontWeight: 800, bgcolor: `${color}1f`, color }}
    />
  );
}

function AerateDate(dateStr) {
  if (!dateStr) return "Today";
  const date = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function DailyChallenge() {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [challenge, setChallenge] = useState(null);
  const [userCompleted, setUserCompleted] = useState(false);
  const [streakData, setStreakData] = useState({ current_streak: 0, longest_streak: 0, total_xp: 0 });
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const userId = useMemo(() => getUserId(), []);

  const loadAll = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      setError("");

      try {
        const [today, streakRes, statsRes, historyRes, calendarRes, boardRes] = await Promise.all([
          getTodaysChallenge(userId),
          getUserStreak(userId),
          getChallengeStatistics(userId),
          getChallengeHistory(userId, 30),
          getChallengeCalendar(userId),
          getChallengeLeaderboard(8),
        ]);

        const t = today.data?.challenge;
        if (t) setChallenge(t);
        if (today.data?.user_completed !== undefined) setUserCompleted(today.data.user_completed);

        const s = streakRes.data?.streak || {};
        setStreakData({
          current_streak: s.current_streak ?? 0,
          longest_streak: s.longest_streak ?? 0,
          total_xp: s.total_xp ?? 0,
        });
        setStats(statsRes.data?.statistics || null);
        setHistory(Array.isArray(historyRes.data?.history) ? historyRes.data.history : []);
        setCalendar(Array.isArray(calendarRes.data?.calendar?.days) ? calendarRes.data.calendar.days : []);
        setLeaderboard(Array.isArray(boardRes.data?.leaderboard) ? boardRes.data.leaderboard : []);

        if (!today.data?.user_completed) {
          setAnswer("");
          setResult(null);
          setStartedAt(Date.now());
        }
      } catch (err) {
        console.error("Daily Challenge fetch error:", err);
        setError("Failed to load today's challenge");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* Live countdown from challenge expiry */
  useEffect(() => {
    if (!challenge?.expires_at) return;
    const tick = () => {
      const diff = new Date(challenge.expires_at).getTime() - Date.now();
      setCountdown(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [challenge?.expires_at]);

  const formatCountdown = () => {
    if (countdown === null) return "—";
    const h = Math.floor(countdown / 3600);
    const m = Math.floor((countdown % 3600) / 60);
    const s = countdown % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const calendarDays = useMemo(
    () => Object.fromEntries(calendar.map((d) => [d.date, d.xp || 1])),
    [calendar]
  );

  /* Build last 10 weeks of calendar cells */
  const calendarCells = useMemo(() => {
    const cells = [];
    const today = new Date();
    for (let i = 97; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      cells.push({ key, day: d, xp: calendarDays[key] || 0 });
    }
    const weeks = [];
    for (let w = 0; w < 14; w += 1) {
      weeks.push(cells.slice(w * 7, w * 7 + 7));
    }
    return weeks;
  }, [calendarDays]);

  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.warning("Enter an answer before submitting.");
      return;
    }
    if (!challenge) return;

    setSubmitting(true);
    try {
      const timeTaken = Math.max(1, Math.round((Date.now() - (startedAt || Date.now())) / 1000));
      const res = await submitChallenge({
        challenge_id: challenge.challenge_id,
        user_id: userId,
        payload: answer,
        time_taken: timeTaken,
      });
      const data = res.data || {};
      setResult(data);

      if (data.is_correct) {
        setUserCompleted(true);
        toast.success(`+${data.xp_earned} XP earned! Streak ${data.streak}`);
        // Refresh streak + history + leaderboard after a correct submission
        const [streakRes, historyRes, statsRes, boardRes] = await Promise.all([
          getUserStreak(userId),
          getChallengeHistory(userId, 30),
          getChallengeStatistics(userId),
          getChallengeLeaderboard(8),
        ]);
        const s = streakRes.data?.streak;
        if (s) setStreakData({ current_streak: s.current_streak ?? 0, longest_streak: s.longest_streak ?? 0, total_xp: s.total_xp ?? 0 });
        setStats(statsRes.data?.statistics || null);
        setHistory(Array.isArray(historyRes.data?.history) ? historyRes.data.history : []);
        setLeaderboard(Array.isArray(boardRes.data?.leaderboard) ? boardRes.data.leaderboard : []);
      } else {
        toast.error("Not quite. Review the hint and try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit challenge");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading skeleton ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <Skeleton variant="rounded" width="45%" height={48} sx={{ bgcolor: "var(--borderColor)" }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={120} sx={{ flex: 1, minWidth: 160, bgcolor: "var(--borderColor)" }} />
            ))}
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5}>
            <Skeleton variant="rounded" height={430} sx={{ flex: 1.5, bgcolor: "var(--borderColor)" }} />
            <Skeleton variant="rounded" height={430} sx={{ flex: 1, bgcolor: "var(--borderColor)" }} />
          </Stack>
        </Stack>
      </Container>
    );
  }

  const statsCards = [
    {
      label: "Current Streak",
      value: streakData.current_streak,
      icon: <Flame size={20} />,
      color: "#F59E0B",
      hint: "Consecutive days completed",
    },
    {
      label: "Longest Streak",
      value: streakData.longest_streak,
      icon: <Trophy size={20} />,
      color: "#22C55E",
      hint: "Your personal best",
    },
    {
      label: "Total XP",
      value: streakData.total_xp,
      icon: <Zap size={20} />,
      color: "#06B6D4",
      hint: "Earned from challenges",
    },
    {
      label: "Completed",
      value: stats?.completed_challenges ?? history.length,
      icon: <CheckCircle2 size={20} />,
      color: "#8B5CF6",
      hint: "Challenges solved",
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
                background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)",
                border: "1px solid rgba(245,158,11,0.35)",
                boxShadow: "0 10px 30px rgba(245,158,11,0.35)",
              }}
            >
              <Target size={26} style={{ color: "#78350F" }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: "var(--textPrimary)" }}>
                Daily Challenge
              </Typography>
              <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5 }}>
                {AerateDate(challenge?.date)} · {challenge?.category || "Security"} · Solve it to keep your streak alive.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.2} alignItems="center">
            {streakData.current_streak > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 20,
                  border: "1px solid rgba(245,158,11,0.35)",
                  bgcolor: "rgba(245,158,11,0.12)",
                  color: "#FBBF24",
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <Flame size={14} />
                {streakData.current_streak} day streak
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
              onClick={() => loadAll(true)}
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
            <XCircle size={18} />
            {error}
            <Button size="small" sx={{ ml: "auto", color: "#EF4444", fontWeight: 700 }} onClick={() => loadAll()}>
              Retry
            </Button>
          </Box>
        </Section>
      )}

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <Section delay={0.08}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
          {statsCards.map((card, i) => (
            <Box key={card.label} sx={{ flex: 1, minWidth: 0 }}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 + i * 0.05 }}
              >
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
              </motion.div>
            </Box>
          ))}
        </Stack>
      </Section>

      {/* ── Today's challenge ──────────────────────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Main challenge card */}
        <Box sx={{ flex: 1.5, minWidth: 0 }}>
          <Section delay={0.12}>
            <Box
              sx={{
                ...CARD,
                p: 0,
                overflow: "hidden",
                border: userCompleted ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--glassBorder)",
              }}
            >
              {/* Gradient hero strip */}
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  background: "linear-gradient(135deg, rgba(124,58,237,0.20) 0%, rgba(37,99,235,0.12) 100%)",
                  borderBottom: "1px solid var(--glassBorder)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 20,
                      bgcolor: "rgba(245,158,11,0.15)",
                      color: "#FBBF24",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <Flame size={14} />
                    +{challenge?.xp_reward ?? 100} XP
                  </Box>
                  <DifficultyBadge level={challenge?.difficulty || "medium"} />
                  {userCompleted && (
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
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--textPrimary)" }}>
                  {challenge?.title || "Today's Security Challenge"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.55, mt: 0.5 }}>
                  {challenge?.description}
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                {/* Timer + hint toggle */}
                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 20,
                      border: "1px solid var(--glassBorder)",
                      bgcolor: "var(--glassBg)",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Clock size={15} style={{ color: countdown <= 3600 ? "#EF4444" : "var(--textSecondary)" }} />
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 800,
                        fontVariantNumeric: "tabular-nums",
                        color: countdown <= 3600 ? "#EF4444" : "var(--textPrimary)",
                      }}
                    >
                      {formatCountdown()}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "var(--textMuted)" }}>remaining</Typography>
                  </Box>
                  <Box flex={1} />
                  <Button
                    size="small"
                    onClick={() => setShowHint((v) => !v)}
                    startIcon={<Lightbulb size={15} />}
                    endIcon={<ChevronDown size={14} style={{ transform: showHint ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
                    sx={{
                      alignSelf: "flex-start",
                      color: "var(--textSecondary)",
                      textTransform: "none",
                      border: "1px solid var(--glassBorder)",
                      bgcolor: "var(--glassBg)",
                      "&:hover": { background: "var(--surfaceHover)", color: "var(--textPrimary)" },
                    }}
                  >
                    Hint
                  </Button>
                </Stack>

                {/* Question */}
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
                  The Challenge
                </Typography>
                <Typography sx={{ fontSize: 15, color: "var(--textPrimary)", lineHeight: 1.6, mb: 2 }}>
                  {challenge?.question}
                </Typography>

                {/* Hint */}
                {showHint && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}>
                    <Box
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(245,158,11,0.35)",
                        bgcolor: "rgba(245,158,11,0.08)",
                        px: 2,
                        py: 1.5,
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <Lightbulb size={16} style={{ color: "#FBBF24", flexShrink: 0, marginTop: 2 }} />
                      <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.5 }}>
                        {challenge?.hint || "No hint available — trust your instincts."}
                      </Typography>
                    </Box>
                  </motion.div>
                )}

                {/* Completed confirmation */}
                {userCompleted && !result && (
                  <Box
                    sx={{
                      borderRadius: 2,
                      border: "1px solid rgba(16,185,129,0.45)",
                      bgcolor: "rgba(16,185,129,0.10)",
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <CheckCircle2 size={20} style={{ color: "#34D399" }} />
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: "var(--textPrimary)" }}>
                        Challenge completed today!
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)" }}>
                        Come back tomorrow for a brand new security challenge.
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Answer input */}
                {!userCompleted && (
                  <>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter your payload or solution…"
                      rows={3}
                      disabled={submitting}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1px solid var(--glassBorder)",
                        background: "var(--glassBg)",
                        color: "var(--textPrimary)",
                        fontSize: 14,
                        lineHeight: 1.5,
                        padding: "12px 14px",
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
                      sx={{
                        mt: 2,
                        height: 46,
                        textTransform: "none",
                        fontSize: 15,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                        color: "#fff",
                        boxShadow: "0 10px 25px rgba(124,58,237,0.4)",
                        "&:hover": { background: "linear-gradient(135deg, #6D28D9 0%, #1D4ED8 100%)" },
                        "&:disabled": { background: "var(--borderColor)", color: "var(--textMuted)", boxShadow: "none" },
                      }}
                    >
                      {submitting ? "Checking…" : "Submit Challenge"}
                    </Button>
                  </>
                )}

                {/* Result feedback */}
                {result && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Box
                      sx={{
                        mt: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${result.is_correct ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                        bgcolor: result.is_correct ? "rgba(16,185,129,0.08)" : "var(--dangerSoft)",
                        px: 2.5,
                        py: 2,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        {result.is_correct ? (
                          <CheckCircle2 size={22} style={{ color: "#34D399" }} />
                        ) : (
                          <XCircle size={22} style={{ color: "#F87171" }} />
                        )}
                        <Box>
                          <Typography sx={{ fontSize: 15, fontWeight: 800, color: result.is_correct ? "#34D399" : "#F87171" }}>
                            {result.is_correct ? "Correct!" : "Incorrect"}
                          </Typography>
                          <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)" }}>
                            {result.feedback}
                          </Typography>
                        </Box>
                        {result.is_correct && (
                          <Box sx={{ ml: "auto", textAlign: "right" }}>
                            <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#FBBF24" }}>
                              +{result.xp_earned} XP
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                              {result.streak_bonus > 0 && `+${result.streak_bonus} streak bonus`}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                      {result.explanation && (
                        <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.6, mt: 1 }}>
                          {result.explanation}
                        </Typography>
                      )}
                    </Box>
                  </motion.div>
                )}
              </Box>
            </Box>
          </Section>
        </Box>

        {/* Right column: streak calendar + leaderboard */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.16}>
            <Box sx={CARD}>
              <CardHead
                icon={<CalendarDays size={20} />}
                color="#06B6D4"
                title="14-Week Streak"
                sub="Your consistent daily wins"
                right={
                  <Chip
                    label={`${Object.keys(calendarDays).length} days`}
                    size="small"
                    sx={{ height: 22, fontSize: 10.5, fontWeight: 800, bgcolor: "rgba(6,182,212,0.15)", color: "#22D3EE" }}
                  />
                }
              />
              <Stack direction="row" spacing={1}>
                <Stack spacing={0.75} sx={{ mr: 0.5 }}>
                  {weekdayLabels.map((label, i) => (
                    <Typography key={i} sx={{ fontSize: 9, color: "var(--textMuted)", height: 14, display: "flex", alignItems: "center" }}>
                      {label}
                    </Typography>
                  ))}
                </Stack>
                <Stack spacing={0.9} direction="row" sx={{ overflowX: "auto", pb: 0.5 }}>
                  {calendarCells.map((week, wi) => (
                    <Stack key={wi} spacing={0.75} justifyContent="flex-start">
                      {week.map((cell) => (
                        <Tooltip key={cell.key} title={cell.xp ? `${cell.key} · ${cell.xp} XP` : cell.key}>
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: 0.75,
                              background: cell.xp
                                ? cell.xp >= 100
                                  ? "#10B981"
                                  : "#34D399"
                                : "var(--borderColor)",
                              opacity: cell.xp ? 1 : 0.65,
                              transition: "transform .15s",
                              "&:hover": { transform: "scale(1.35)" },
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Section>

          <Section delay={0.2}>
            <Box sx={{ ...CARD, mt: 2.5 }}>
              <CardHead
                icon={<Trophy size={20} />}
                color="#F59E0B"
                title="Leaderboard"
                sub="Top challengers this season"
              />
              {leaderboard.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                  No challengers yet. Be the first to complete one!
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {leaderboard.map((entry, i) => (
                    <Stack key={entry.user_id} direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 800,
                          bgcolor:
                            i === 0
                              ? "rgba(234,179,8,0.2)"
                              : i === 1
                                ? "rgba(148,163,184,0.2)"
                                : i === 2
                                  ? "rgba(180,83,9,0.2)"
                                  : "var(--infoSoft)",
                          color: i === 0 ? "#FBBF24" : i === 1 ? "#94A3B8" : i === 2 ? "#F59E0B" : "var(--textSecondary)",
                          flexShrink: 0,
                        }}
                      >
                        {i === 0 ? <Medal size={15} /> : i === 1 ? <Medal size={15} /> : i === 2 ? <Medal size={15} /> : i + 1}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "var(--textPrimary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {entry.display_name || entry.user_id}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                          {entry.challenges_completed} challenge{entry.challenges_completed !== 1 ? "s" : ""} completed
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#FBBF24" }}>
                        {entry.total_xp} XP
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── History ────────────────────────────────────────────────────── */}
      <Section delay={0.22}>
        <Box sx={{ ...CARD, mt: 2.5 }}>
          <CardHead
            icon={<History size={20} />}
            color="#2563EB"
            title="Recent History"
            sub="Your challenge completions"
            right={
              <Chip
                label={`${history.length} total`}
                size="small"
                sx={{ height: 22, fontSize: 10.5, fontWeight: 800, bgcolor: "rgba(37,99,235,0.15)", color: "#60A5FA" }}
              />
            }
          />
          {history.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
              No completed challenges yet. Solve today's challenge to start your history!
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {history.slice(0, 6).map((item, i) => (
                <Stack key={`${item.date}-${i}`} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(37,99,235,0.15)",
                      color: "#60A5FA",
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen size={16} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--textPrimary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {item.challenge_name || item.challenge_id}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                      {AerateDate(item.date)} · {item.category} · {item.time_taken}s
                    </Typography>
                  </Box>
                  <Stack alignItems="flex-end">
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#FBBF24" }}>
                      +{item.xp_earned} XP
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: "var(--textMuted)" }}>
                      streak {item.streak}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </Section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <Section delay={0.28}>
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
              A new challenge every day — powered by OWASP Top 10 scenarios.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Sparkles size={14} style={{ color: "var(--textMuted)" }} />
            <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>
              CyberShield Daily Challenge
            </Typography>
          </Stack>
        </Stack>
      </Section>
    </Container>
  );
}