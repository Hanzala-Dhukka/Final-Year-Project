import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, Check } from "lucide-react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Tooltip,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Switch,
  Dialog,
  DialogContent,
  Alert,
  InputAdornment,
  TextField,
  MenuItem,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import MailIcon from "@mui/icons-material/Mail";
import LockIcon from "@mui/icons-material/Lock";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsIcon from "@mui/icons-material/Notifications";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShieldIcon from "@mui/icons-material/Shield";
import DevicesIcon from "@mui/icons-material/Devices";
import CastIcon from "@mui/icons-material/Cast";
import LanguageIcon from "@mui/icons-material/Language";
import PaletteIcon from "@mui/icons-material/Palette";
import LoginIcon from "@mui/icons-material/Login";
import DeviceUnknownIcon from "@mui/icons-material/DeviceUnknown";

import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/Animation/ToastProvider";
import API from "../../api/api";
import {
  getProfileSettings,
  updateUserSettings,
  changePassword,
} from "../../services/profileService";

/* ── Design tokens ─────────────────────────────────────────────────────── */
const API_ORIGIN = "http://localhost:8000";

const GLASS = {
  background: "var(--glassBg)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--glassBorder)",
  borderRadius: "14px",
  boxShadow: "var(--shadow)",
};

const CARD = {
  ...GLASS,
  padding: 2.5,
};

const FIELD_SX = {
  "& .MuiInputLabel-root": { color: "var(--textMuted)" },
  "& .MuiOutlinedInput-root": {
    color: "var(--textPrimary)",
    background: "var(--glassBg)",
    "& fieldset": { borderColor: "var(--borderColor)" },
    "&:hover fieldset": { borderColor: "var(--borderStrong)" },
    "&.Mui-focused fieldset": { borderColor: "#2563EB" },
  },
  "& .MuiOutlinedInput-input": { color: "var(--textPrimary)" },
  "& .MuiInputAdornment-root": { color: "var(--textMuted)" },
};

const LANGUAGES = [
  "English",
  "Urdu",
  "Hindi",
  "Arabic",
  "French",
  "Spanish",
  "German",
  "Chinese",
];

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

function CardTitle({ icon, color, title, sub }) {
  return (
    <>
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
          {sub && <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>{sub}</Typography>}
        </Box>
      </Stack>
      <Divider sx={{ borderColor: "var(--borderColor)", mb: 2 }} />
    </>
  );
}

function formatDate(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function DeviceIcon({ device }) {
  const label = String(device || "").toLowerCase();
  const size = 18;
  if (label.includes("phone") || label.includes("mobile") || label.includes("iphone"))
    return <DevicesIcon sx={{ fontSize: size, color: "var(--textMuted)" }} />;
  if (label.includes("tablet") || label.includes("ipad"))
    return <DevicesIcon sx={{ fontSize: size, color: "var(--textMuted)" }} />;
  if (label.includes("mac") || label.includes("linux") || label.includes("windows"))
    return <CastIcon sx={{ fontSize: size, color: "var(--textMuted)" }} />;
  return <DeviceUnknownIcon sx={{ fontSize: size, color: "var(--textMuted)" }} />;
}

/* ── Change password dialog ────────────────────────────────────────────── */
function PasswordDialog({ open, onClose, onSaved }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setOldPw("");
      setNewPw("");
      setConfirm("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changePassword({ old_password: oldPw, new_password: newPw });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 800, color: "var(--textPrimary)", fontSize: 20, mb: 2 }}>
          Change Password
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment> }}
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            size="small"
            helperText="At least 8 characters"
            FormHelperTextProps={{ sx: { color: "var(--textMuted)" } }}
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            size="small"
            sx={FIELD_SX}
          />
          <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              sx={{ borderColor: "var(--borderStrong)", color: "var(--textSecondary)" }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", color: "#fff", "&:hover": { filter: "brightness(1.08)" } }}
            >
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </Box>
          <Typography sx={{ color: "var(--textMuted)", fontSize: 12 }}>
            You will be signed out from all devices after changing your password.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ── Confirm dialog for logging out all sessions ───────────────────────── */
function ConfirmDialog({ open, title, message, confirmLabel, busy, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ borderRadius: 2, textAlign: "center", pt: 3 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            mx: "auto",
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "var(--dangerSoft)",
            color: "#EF4444",
          }}
        >
          <LoginIcon />
        </Box>
        <Typography sx={{ fontWeight: 800, color: "var(--textPrimary)", fontSize: 18 }}>
          {title}
        </Typography>
        <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5, mt: 1, mb: 2 }}>
          {message}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderColor: "var(--borderStrong)", color: "var(--textSecondary)" }}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            disabled={busy}
            onClick={onConfirm}
            sx={{ background: "#EF4444", color: "#fff", "&:hover": { background: "#DC2626" } }}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, isDark, setMode } = useTheme();
  const toast = useToast();

  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyToggle, setBusyToggle] = useState("");
  const [busySession, setBusySession] = useState("");
  const [busyAll, setBusyAll] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsRes, sessionsRes] = await Promise.allSettled([
        getProfileSettings(),
        API.get("/auth/session/list"),
      ]);
      if (settingsRes.status === "fulfilled") {
        setSettings(settingsRes.value || {});
      } else {
        setError("Could not load your settings. Please refresh.");
      }
      if (sessionsRes.status === "fulfilled") {
        const data = sessionsRes.value.data;
        setSessions(Array.isArray(data) ? data : data?.sessions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Keep the visible theme in sync with what's saved in the backend.
  // Only apply it when the user hasn't already chosen a theme locally so the
  // Settings page never fights the global ThemeProvider.
  useEffect(() => {
    const localPref = localStorage.getItem("cybershield-theme");
    if (
      !localPref &&
      settings?.theme &&
      (settings.theme === "dark" || settings.theme === "light")
    ) {
      setMode(settings.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.theme]);

  const persistSettings = async (patch, onDone) => {
    try {
      await updateUserSettings(patch);
      setSettings((s) => ({ ...(s || {}), ...patch }));
      onDone?.();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save preference");
      return false;
    }
  };

  const handleThemeChange = async (next) => {
    if (next === mode) return;
    const ok = await persistSettings({ theme: next });
    if (ok) setMode(next);
  };

  const handleLanguageChange = async (e) => {
    await persistSettings({ language: e.target.value });
    toast.success("Language preference saved");
  };

  const toggleNotif = async (key) => {
    if (busyToggle) return;
    setBusyToggle(key);
    const next = !settings?.[key];
    const ok = await persistSettings({ [key]: next });
    if (ok) toast.success("Preference saved");
    setBusyToggle("");
  };

  const handleCloseSession = async (sessionId) => {
    if (busySession) return;
    setBusySession(sessionId);
    try {
      await API.delete(`/auth/session/${sessionId}`);
      setSessions((s) => s.filter((x) => x.id !== sessionId));
      toast.success("Session closed successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to close session");
    } finally {
      setBusySession("");
    }
  };

  const handleLogoutAll = async () => {
    setBusyAll(true);
    try {
      await API.post("/auth/session/logout-all");
      setSessions([]);
      setAllOpen(false);
      toast.success("All other sessions closed successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to close all sessions");
      setAllOpen(false);
    } finally {
      setBusyAll(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const displayName = user?.name || user?.full_name || "CyberShield User";
  const displayEmail = user?.email || "—";
  const avatarUrl = user?.profile_image || user?.avatar ? `${API_ORIGIN}${user?.profile_image || user?.avatar}` : null;
  const initials = String(displayName)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "CS";

  const notifItems = [
    { key: "email_notifications", label: "Email notifications", desc: "Updates about labs, scans and account activity by email.", icon: MailIcon, color: "#38BDF8" },
    { key: "security_alerts", label: "Security alerts", desc: "Instant alerts when a scan flags a critical risk.", icon: NotificationsActiveIcon, color: "#EF4444" },
    { key: "lab_notifications", label: "Lab notifications", desc: "Results and tips after finishing attack labs.", icon: NotificationsIcon, color: "#F59E0B" },
    { key: "achievement_notifications", label: "Achievement alerts", desc: "Milestones, streaks and badges you earn.", icon: EmojiEventsIcon, color: "#8B5CF6" },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 12 }}>
          <CircularProgress />
          <Typography sx={{ color: "var(--textMuted)" }}>Loading your settings…</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Section>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
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
              <SettingsIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: "var(--textPrimary)" }}>
                Settings
              </Typography>
              <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5 }}>
                Manage your appearance, notifications, security and devices.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.2} alignItems="center">
            <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              <Box
                component="button"
                onClick={() => handleThemeChange(isDark ? "light" : "dark")}
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
              startIcon={<RefreshIcon />}
              onClick={loadAll}
              sx={{
                background: "var(--glassBg)",
                color: "var(--textPrimary)",
                border: "1px solid var(--glassBorder)",
                boxShadow: "none",
                "&:hover": { background: "var(--surfaceHover)" },
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ borderColor: "var(--borderColor)" }} />
      </Section>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Profile strip ──────────────────────────────────────────────── */}
      <Section delay={0.05}>
        <Box sx={{ ...GLASS, p: 2.5, mt: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {avatarUrl ? (
            <Avatar src={avatarUrl} sx={{ width: 56, height: 56, fontSize: 22, fontWeight: 800, border: "2px solid var(--glassBorder)" }} />
          ) : (
            <Avatar sx={{ width: 56, height: 56, fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 55%, #EC4899 100%)" }}>
              {initials}
            </Avatar>
          )}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 200, flexWrap: "wrap", rowGap: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: "var(--textPrimary)" }}>{displayName}</Typography>
            <Chip
              label={(user?.role || "student").toUpperCase()}
              size="small"
              sx={{ fontWeight: 700, fontSize: 10.5, height: 22, bgcolor: "var(--infoSoft)", color: "var(--textSecondary)" }}
            />
          </Stack>
          <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5, flex: "1 1 180px" }}>{displayEmail}</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              onClick={() => navigate("/profile")}
              sx={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", color: "#fff", "&:hover": { filter: "brightness(1.08)" } }}
            >
              Edit Profile
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSignOut}
              sx={{ borderColor: "var(--borderStrong)", color: "#EF4444", "&:hover": { background: "var(--dangerSoft)" } }}
            >
              Sign Out
            </Button>
          </Stack>
        </Box>
      </Section>

      {/* ── Row: Appearance + Notifications ────────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Appearance */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.1}>
            <Box sx={CARD}>
              <CardTitle icon={<PaletteIcon style={{ fontSize: 20 }} />} color="#8B5CF6" title="Appearance" sub="Pick how CyberShield looks for you" />

              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
                Interface theme
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {[
                  { value: "light", label: "Light", icon: <Sun size={20} />, preview: "#FFFFFF", acc: "#E2E8F0" },
                  { value: "dark", label: "Dark", icon: <Moon size={20} />, preview: "#0F172A", acc: "#1E293B" },
                ].map((t) => {
                  const active = mode === t.value;
                  return (
                    <Box
                      key={t.value}
                      onClick={() => handleThemeChange(t.value)}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        border: active ? "2px solid #2563EB" : "1px solid var(--borderStrong)",
                        background: "var(--glassBg)",
                        padding: 1.25,
                        cursor: "pointer",
                        transition: "all 200ms",
                        "&:hover": { borderColor: active ? "#2563EB" : "#2563EB88", background: "var(--surfaceHover)" },
                      }}
                    >
                      <Box
                        sx={{
                          height: 52,
                          borderRadius: 1.5,
                          bgcolor: t.preview,
                          border: "1px solid var(--borderColor)",
                          mb: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: t.value === "dark" ? "#E2E8F0" : "#334155",
                        }}
                      >
                        {t.icon}
                      </Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: active ? "#2563EB" : "var(--textPrimary)" }}>
                          {t.label}
                        </Typography>
                        {active && (
                          <Box sx={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            <Check size={12} strokeWidth={3} />
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>

              <Divider sx={{ borderColor: "var(--borderColor)", my: 2 }} />

              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
                Language
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label="Language"
                value={settings?.language || "English"}
                onChange={handleLanguageChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><Globe size={16} /></InputAdornment> }}
                sx={FIELD_SX}
              >
                {LANGUAGES.map((l) => (
                  <MenuItem key={l} value={l}>{l}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Section>
        </Box>

        {/* Notifications */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.15}>
            <Box sx={CARD}>
              <CardTitle icon={<NotificationsIcon style={{ fontSize: 20 }} />} color="#F59E0B" title="Notifications" sub="Choose what you want to hear about" />
              {notifItems.map((item) => (
                <Stack key={item.key} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.75 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: `${item.color}1f`,
                      color: item.color,
                      flexShrink: 0,
                    }}
                  >
                    <item.icon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, color: "var(--textPrimary)", fontWeight: 600 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>{item.desc}</Typography>
                  </Box>
                  <Switch
                    checked={!!settings?.[item.key]}
                    onChange={() => toggleNotif(item.key)}
                    disabled={busyToggle === item.key}
                    size="small"
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: item.color },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: item.color },
                    }}
                  />
                </Stack>
              ))}
              {busyToggle && (
                <Typography sx={{ fontSize: 12, color: "var(--textMuted)", mt: 1, textAlign: "right" }}>Saving…</Typography>
              )}
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Row: Security + Active Sessions ────────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Security */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.15}>
            <Box sx={CARD}>
              <CardTitle icon={<ShieldIcon style={{ fontSize: 20 }} />} color="#22C55E" title="Account Security" sub="Keep your CyberShield account safe" />

              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<LockIcon />}
                onClick={() => setPwOpen(true)}
                sx={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", color: "#fff", mb: 2, "&:hover": { filter: "brightness(1.08)" } }}
              >
                Change Password
              </Button>

              <Stack spacing={1}>
                {[
                  "Access tokens expire after 15 minutes",
                  "Refresh tokens expire after 7 days",
                  "Sessions auto-expire after 30 minutes of inactivity",
                  "Changing your password signs you out everywhere",
                ].map((tip) => (
                  <Stack key={tip} direction="row" spacing={1} alignItems="flex-start">
                    <Check size={15} style={{ color: "#10B981", marginTop: 2, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", lineHeight: 1.4 }}>{tip}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Section>
        </Box>

        {/* Active sessions */}
        <Box sx={{ flex: 1.35, minWidth: 0 }}>
          <Section delay={0.2}>
            <Box sx={CARD}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box sx={{ width: 34, height: 34, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#38BDF81f", color: "#38BDF8", flexShrink: 0 }}>
                    <DevicesIcon style={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--textPrimary)" }}>Active Sessions</Typography>
                    <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Devices you're signed in on</Typography>
                  </Box>
                </Stack>
                {sessions.length > 1 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAllOpen(true)}
                    disabled={busyAll}
                    sx={{ borderColor: "var(--borderStrong)", color: "#EF4444", fontSize: 11.5, "&:hover": { background: "var(--dangerSoft)" } }}
                  >
                    Logout All
                  </Button>
                )}
              </Stack>

              {sessions.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <DevicesIcon sx={{ fontSize: 34, color: "var(--textMuted)", mb: 1 }} />
                  <Typography sx={{ color: "var(--textSecondary)", fontWeight: 600 }}>No active sessions</Typography>
                  <Typography sx={{ color: "var(--textMuted)", fontSize: 12.5 }}>This device is the only one signed in.</Typography>
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {sessions.map((session) => (
                    <Box
                      key={session.id}
                      sx={{ border: "1px solid var(--borderColor)", borderRadius: 2, px: 1.5, py: 1.25, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", background: "var(--glassBg)" }}
                    >
                      <DeviceIcon device={session.device} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.4 }}>
                          <Typography sx={{ fontSize: 13.5, color: "var(--textPrimary)", fontWeight: 600 }}>
                            {session.device || "Unknown Device"}
                          </Typography>
                          {session.active !== false && (
                            <Chip
                              label="ACTIVE"
                              size="small"
                              sx={{ height: 18, fontSize: 9.5, fontWeight: 800, bgcolor: "var(--successSoft)", color: "#10B981" }}
                            />
                          )}
                        </Stack>
                        <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>
                          {session.location || "Unknown location"} · {session.ip_address || "—"} · Last active {formatDate(session.last_activity)}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        disabled={busySession === session.id}
                        onClick={() => handleCloseSession(session.id)}
                        sx={{ color: "#EF4444", border: "1px solid var(--borderStrong)", fontSize: 11.5, "&:hover": { background: "var(--dangerSoft)" } }}
                      >
                        {busySession === session.id ? "Closing…" : "Logout"}
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Footer info ────────────────────────────────────────────────── */}
      <Section delay={0.25}>
        <Box
          sx={{
            mt: 2.5,
            borderRadius: 2,
            border: "1px solid var(--borderColor)",
            background: "var(--glassBg)",
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          <ShieldIcon sx={{ color: "#3B82F6", fontSize: 20, mt: 0.25, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--textPrimary)" }}>Login history</Typography>
            <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", lineHeight: 1.5 }}>
              Review where and when you've signed in using the <b>Recent Activity</b> panel on your profile page.
              Always sign out of devices you no longer use.
            </Typography>
          </Box>
        </Box>
      </Section>

      {/* ── Dialogs ────────────────────────────────────────────────────── */}
      <PasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} onSaved={() => toast.success("Password changed successfully")} />
      <ConfirmDialog
        open={allOpen}
        title="Logout all other devices?"
        message="This will close every active session except this one. You'll need to sign in again on those devices."
        confirmLabel="Logout All"
        busy={busyAll}
        onConfirm={handleLogoutAll}
        onClose={() => setAllOpen(false)}
      />
    </Container>
  );
}