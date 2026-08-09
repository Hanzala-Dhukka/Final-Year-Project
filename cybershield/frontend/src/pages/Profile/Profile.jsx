import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, Camera } from "lucide-react";
import { Box, Container, Typography, Stack, Button, Tooltip, Avatar, Chip, Divider, CircularProgress, InputAdornment, TextField, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SpeedIcon from "@mui/icons-material/Speed";
import BoltIcon from "@mui/icons-material/Bolt";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ScienceIcon from "@mui/icons-material/Science";
import QuizIcon from "@mui/icons-material/Quiz";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BadgeIcon from "@mui/icons-material/Badge";
import MailIcon from "@mui/icons-material/Mail";
import LockIcon from "@mui/icons-material/Lock";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import HistoryIcon from "@mui/icons-material/History";
import InfoIcon from "@mui/icons-material/Info";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PhoneIcon from "@mui/icons-material/Phone";
import ShieldIcon from "@mui/icons-material/Shield";
import CastIcon from "@mui/icons-material/Cast";
import { useTheme } from "../../theme/useTheme";
import { useAuth } from "../../contexts/AuthContext";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getRichProfile,
  getProfileSettings,
  updateUserSettings,
  getLoginActivity,
  getSecurityScore,
  recalculateSecurityScore,
  changePassword,
} from "../../services/profileService";

/* ── Design tokens ─────────────────────────────────────────────────────── */
const API_ORIGIN = "http://localhost:8000";

const LEVEL_COLOR = {
  Beginner: "#38BDF8",
  Intermediate: "#F59E0B",
  Advanced: "#8B5CF6",
  Expert: "#22C55E",
};

const FACTOR_META = {
  password_strength: { label: "Password Strength", max: 20, color: "#8B5CF6", icon: LockIcon },
  labs_completed: { label: "Lab Coverage", max: 30, color: "#22C55E", icon: ScienceIcon },
  security_learning: { label: "Security Learning", max: 25, color: "#38BDF8", icon: QuizIcon },
  account_security: { label: "Account Security", max: 25, color: "#F59E0B", icon: BadgeIcon },
};

const STATUS_META = {
  success: { label: "Success", color: "#22C55E" },
  failed: { label: "Failed", color: "#EF4444" },
  suspicious: { label: "Suspicious", color: "#F59E0B" },
};

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

/* ── Small helpers ─────────────────────────────────────────────────────── */
function Section({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay }}>
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
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--textPrimary)" }}>{title}</Typography>
          {sub && <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>{sub}</Typography>}
        </Box>
        </Stack>
      <Divider sx={{ borderColor: "var(--borderColor)", mb: 2 }} />
    </>
  );
}

function SectionEmpty({ icon, title, sub }) {
  return (
    <Box sx={{ py: 5, textAlign: "center" }}>
      <Box sx={{ color: "var(--textMuted)", mb: 1 }}>{icon}</Box>
      <Typography sx={{ color: "var(--textSecondary)", fontWeight: 600 }}>{title}</Typography>
      {sub && <Typography sx={{ color: "var(--textMuted)", fontSize: 13 }}>{sub}</Typography>}
    </Box>
  );
}

function TimeLabel({ iso }) {
  if (!iso) return <Typography component="span" sx={{ color: "var(--textMuted)", fontSize: 12 }}>—</Typography>;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return <Typography component="span" sx={{ color: "var(--textMuted)", fontSize: 12 }}>—</Typography>;
  return (
    <Typography component="span" sx={{ color: "var(--textMuted)", fontSize: 12 }}>
      {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
      {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
    </Typography>
  );
}

function UserAvatar({ src, name, size = 96, sx = {} }) {
  const [failed, setFailed] = useState(false);
  const initials =
    String(name || "SV")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase() || "SV";
  const base = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.38),
    fontWeight: 800,
    color: "#fff",
    border: "2px solid var(--glassBorder)",
    flexShrink: 0,
    ...sx,
  };
  if (src && !failed) {
    return <Avatar alt={name} src={src} onError={() => setFailed(true)} sx={base} />;
  }
  return (
    <Avatar alt={name} sx={{ ...base, background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 55%, #EC4899 100%)" }}>
      {initials}
    </Avatar>
  );
}

function GithubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.92 0-1.31.47-2.38 1.23-3.22-.12-.47-.53-1.52-1.23-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.61-5.49 5.91.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/* ── Edit profile dialog ───────────────────────────────────────────────── */
function EditProfileDialog({ open, profile, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        college: profile.college || "",
        course: profile.course || "",
        year: profile.year || "",
        github: profile.github || "",
        linkedin: profile.linkedin || "",
        website: profile.website || "",
      });
      setError("");
    }
  }, [open, profile]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form?.full_name?.trim()) {
      setError("Full name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile({ ...form, full_name: form.full_name.trim() });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: "var(--textPrimary)", fontWeight: 800, fontSize: 20 }}>Edit Profile</DialogTitle>
      <DialogContent dividers sx={{ borderColor: "var(--borderColor)" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name *"
            value={form?.full_name || ""}
            onChange={set("full_name")}
            required
            size="small"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="Phone"
            type="tel"
            value={form?.phone || ""}
            onChange={set("phone")}
            size="small"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="College"
            value={form?.college || ""}
            onChange={set("college")}
            size="small"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="Course"
            value={form?.course || ""}
            onChange={set("course")}
            size="small"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="Year"
            value={form?.year || ""}
            onChange={set("year")}
            size="small"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="GitHub"
            value={form?.github || ""}
            onChange={set("github")}
            size="small"
            placeholder="https://github.com/username"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="LinkedIn"
            value={form?.linkedin || ""}
            onChange={set("linkedin")}
            size="small"
            placeholder="https://linkedin.com/in/username"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="Website"
            value={form?.website || ""}
            onChange={set("website")}
            size="small"
            placeholder="https://yourwebsite.com"
            sx={FIELD_SX}
          />
          <TextField
            fullWidth
            label="Bio"
            value={form?.bio || ""}
            onChange={set("bio")}
            size="small"
            multiline
            minRows={3}
            sx={FIELD_SX}
          />
          <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
            <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderColor: "var(--borderStrong)", color: "var(--textSecondary)" }}>
              Cancel
            </Button>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", color: "#fff", "&:hover": { filter: "brightness(1.08)" } }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

/* ── Avatar dialog ─────────────────────────────────────────────────────── */
function AvatarDialog({ open, onClose, onUpload, onDelete, hasAvatar, origin }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPreview(null);
      setFile(null);
      setError("");
    }
  }, [open]);

  const handleSelect = (e) => {
    const f = e.target.files?.[0];
    setError("");
    if (!f) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      setError("Only JPG, PNG and WEBP images are supported");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2 MB");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await onUpload(file);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload image");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError("");
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to remove avatar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ textAlign: "center" }}>
        <Typography sx={{ fontWeight: 800, color: "var(--textPrimary)", fontSize: 20, mb: 2 }}>Change Avatar</Typography>
        {preview ? (
          <BareAvatarImage url={preview} size={120} />
        ) : !hasAvatar ? (
          <Box sx={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 55%, #EC4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", mx: "auto", mb: 2 }}>
            <Camera size={44} />
          </Box>
        ) : (
          <Box sx={{ mb: 2 }} />
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleSelect} hidden />
        <Button
          fullWidth
          variant="contained"
          onClick={() => fileRef.current.click()}
          sx={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", mb: 1, "&:hover": { filter: "brightness(1.08)" } }}
        >
          Choose Image
        </Button>
        {file && (
          <Button fullWidth variant="contained" disabled={busy} onClick={handleUpload} sx={{ background: "#10B981", mb: 1, "&:hover": { background: "#059669" } }}>
            {busy ? "Uploading..." : "Upload Photo"}
          </Button>
        )}
        {hasAvatar && (
          <Button fullWidth variant="outlined" disabled={busy} onClick={handleRemove} sx={{ color: "#EF4444", borderColor: "var(--borderStrong)", mb: 1 }}>
            Remove Current Avatar
          </Button>
        )}
        {error && (
          <Typography sx={{ color: "#EF4444", fontSize: 13, mt: 1 }}>{error}</Typography>
        )}
        <Typography sx={{ color: "var(--textMuted)", fontSize: 12, mt: 2 }}>
          JPG, PNG or WEBP up to 2 MB
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

function BareAvatarImage({ url, size = 96 }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
      <img src={url} alt="Avatar preview" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--glassBorder)" }} />
    </Box>
  );
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
      <DialogContent>
        <Typography sx={{ fontWeight: 800, color: "var(--textPrimary)", fontSize: 20, mb: 2 }}>Change Password</Typography>
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
            <Button fullWidth variant="outlined" onClick={onClose} sx={{ borderColor: "var(--borderStrong)", color: "var(--textSecondary)" }}>
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
            You will be signed out after the current session expires.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ── Stat tile ─────────────────────────────────────────────────────────── */
/* ── Main page ─────────────────────────────────────────────────────────── */
export default function Profile() {
  const { isDark, toggleTheme } = useTheme();
  const { user: authUser, setUser: setAuthUser } = useAuth();

  // Basic identity (from the users collection)
  const [profile, setProfile] = useState(null);
  // Rich profile (statistics + settings + activity + security score)
  const [rich, setRich] = useState(null);
  const [settings, setSettings] = useState(null);
  const [activity, setActivity] = useState(null);
  const [security, setSecurity] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notif, setNotif] = useState({ email_notifications: true, security_alerts: true, lab_notifications: true, achievement_notifications: true });
  const [busyToggle, setBusyToggle] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const [recalcBusy, setRecalcBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const notify = (message, severity = "success") => setToast({ open: true, message, severity });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [basic, r, st, act, sec] = await Promise.allSettled([
        getProfile(),
        getRichProfile(),
        getProfileSettings(),
        getLoginActivity(),
        getSecurityScore(),
      ]);
      if (basic.status === "fulfilled") {
        setProfile(basic.value);
      } else {
        setError("Could not load your profile. Check your connection and refresh.");
      }
      if (r.status === "fulfilled") setRich(r.value);
      if (st.status === "fulfilled") {
        const s = st.value || {};
        setSettings(s);
        setNotif({
          email_notifications: s.email_notifications ?? true,
          security_alerts: s.security_alerts ?? true,
          lab_notifications: s.lab_notifications ?? true,
          achievement_notifications: s.achievement_notifications ?? true,
        });
      }
      if (act.status === "fulfilled") setActivity(act.value);
      if (sec.status === "fulfilled") setSecurity(sec.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileSave = (updated) => {
    setProfile((p) => ({ ...p, ...updated }));
    setAuthUser((u) => ({ ...u, full_name: updated.full_name }));
    notify("Profile updated successfully");
  };

  const handleAvatarUpload = async (file) => {
    const result = await uploadAvatar(file);
    const imagePath = result.profile_image;
    setProfile((p) => ({ ...p, profile_image: imagePath }));
    setAuthUser((u) => ({ ...u, profile_image: imagePath }));
    notify("Avatar updated");
  };

  const handleAvatarDelete = async () => {
    await deleteAvatar();
    setProfile((p) => ({ ...p, profile_image: null }));
    setAuthUser((u) => ({ ...u, profile_image: null }));
    notify("Avatar removed");
  };

  const toggleNotif = async (key) => {
    if (busyToggle) return;
    setBusyToggle(key);
    const next = !notif[key];
    setNotif((n) => ({ ...n, [key]: next }));
    try {
      await updateUserSettings({ [key]: next });
      notify("Preference saved");
    } catch (e) {
      setNotif((n) => ({ ...n, [key]: !next }));
      notify("Failed to update preference", "error");
    } finally {
      setBusyToggle("");
    }
  };

  const handleRecalc = async () => {
    setRecalcBusy(true);
    setError("");
    try {
      const res = await recalculateSecurityScore();
      setSecurity(res);
      notify("Security score recalculated");
    } catch (e) {
      notify("Failed to recalculate score", "error");
    } finally {
      setRecalcBusy(false);
    }
  };

  const handlePasswordSaved = () => notify("Password changed successfully");

  const displayName = profile?.full_name || rich?.username || "CyberShield User";
  const displayEmail = profile?.email || rich?.email || "—";
  const avatarUrl = profile?.profile_image ? `${API_ORIGIN}${profile.profile_image}` : null;

  const stats = rich?.statistics || {};
  const statTiles = [
    { key: "xp", label: "Total XP", value: stats.xp ?? 0, icon: BoltIcon, color: "#8B5CF6" },
    { key: "level", label: "Level", value: stats.level ?? 1, icon: WorkspacePremiumIcon, color: "#38BDF8" },
    { key: "streak_days", label: "Day Streak", value: stats.streak_days ?? 0, icon: LocalFireDepartmentIcon, color: "#F97316" },
    { key: "labs_completed", label: "Labs Completed", value: stats.labs_completed ?? 0, icon: ScienceIcon, color: "#22C55E" },
    { key: "quizzes_completed", label: "Quizzes Taken", value: stats.quizzes_completed ?? 0, icon: QuizIcon, color: "#F59E0B" },
    { key: "achievements", label: "Achievements", value: stats.achievements ?? 0, icon: EmojiEventsIcon, color: "#FBBF24" },
    { key: "average_quiz_score", label: "Avg Quiz Score", value: stats.average_quiz_score != null ? `${stats.average_quiz_score}%` : "—", icon: TrendingUpIcon, color: "#06B6D4" },
  ];

  const level = security?.level || "Beginner";
  const score = security?.score ?? 0;
  const levelColor = LEVEL_COLOR[level] || "#38BDF8";
  const scoreColor = score >= 80 ? "#22C55E" : score >= 60 ? "#38BDF8" : score >= 40 ? "#F59E0B" : "#EF4444";

  const personalRows = [
    profile?.phone && { icon: PhoneIcon, label: "Phone", value: profile.phone },
    profile?.college && { icon: SchoolIcon, label: "College", value: profile.college },
    profile?.course && { icon: MenuBookIcon, label: "Course", value: profile.course },
    profile?.year && { icon: WorkspacePremiumIcon, label: "Year", value: profile.year },
  ].filter(Boolean);

  const socialLinks = [
    profile?.github && { icon: GithubIcon, label: "GitHub", url: profile.github },
    profile?.linkedin && { icon: LinkedinIcon, label: "LinkedIn", url: profile.linkedin },
    profile?.website && { icon: Globe, label: "Website", url: profile.website },
  ].filter(Boolean);

  const notifItems = [
    { key: "email_notifications", label: "Email notifications", desc: "Updates about labs and results by email.", icon: MailIcon },
    { key: "security_alerts", label: "Security alerts", desc: "Instant alerts when a scan flags a critical risk.", icon: NotificationsActiveIcon },
    { key: "lab_notifications", label: "Lab notifications", desc: "Results and tips after finishing attack labs.", icon: NotificationsIcon },
    { key: "achievement_notifications", label: "Achievement alerts", desc: "Milestones, streaks and badges you earn.", icon: EmojiEventsIcon },
  ];

  const recentLogins = activity?.recent_logins || [];

  const accountRows = [
    { label: "Email", value: displayEmail },
    { label: "Role", value: (profile?.role || "student").toUpperCase() },
    { label: "Email Verified", value: authUser?.is_verified ? "Yes" : "No" },
    { label: "Member Since", value: authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : "—" },
    {
      label: "Last Login",
      value: activity?.last_login || authUser?.last_login ? new Date(activity?.last_login || authUser?.last_login).toLocaleString() : "—",
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 12 }}>
          <CircularProgress />
          <Typography sx={{ color: "var(--textMuted)" }}>Loading your profile…</Typography>
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
              <ShieldIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: "var(--textPrimary)" }}>
                My Profile
              </Typography>
              <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5 }}>
                Identity, security posture and learning preferences — all in one place.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "row", sm: "row" }} spacing={1.2} alignItems="center">
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

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <Section delay={0.05}>
        <Box sx={{ ...GLASS, p: 3, mt: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "stretch", md: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <Box sx={{ position: "relative" }}>
                <UserAvatar src={avatarUrl} name={displayName} size={104} />
                <Tooltip title="Change photo">
                  <Box
                    component="button"
                    onClick={() => setAvatarOpen(true)}
                    aria-label="Change profile picture"
                    sx={{
                      position: "absolute",
                      right: -4,
                      bottom: -4,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "2px solid var(--glassBorder)",
                      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "&:hover": { filter: "brightness(1.1)" },
                    }}
                  >
                    <Camera size={17} />
                  </Box>
                </Tooltip>
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap", rowGap: 0.5 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: "var(--textPrimary)", letterSpacing: "-0.02em" }}>
                    {displayName}
                  </Typography>
                  <Chip
                    label={`${(profile?.role || "student").toUpperCase()}${authUser?.is_verified ? " · VERIFIED" : ""}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 11,
                      height: 22,
                      bgcolor: "var(--successSoft)",
                      border: "1px solid var(--borderColor)",
                      color: "var(--textSecondary)",
                    }}
                  />
                </Stack>
                <Typography sx={{ color: "var(--textSecondary)", fontSize: 14, mb: 0.5 }}>{displayEmail}</Typography>
                <Typography sx={{ color: "var(--textMuted)", fontSize: 13, mb: 1.5 }}>
                  {profile?.course ? `${profile.course}${profile.year ? ` · ${profile.year}` : ""}` : "Security Student"}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditOpen(true)}
                    sx={{
                      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                      color: "#fff",
                      "&:hover": { filter: "brightness(1.08)" },
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    size="small"
                    startIcon={<VpnKeyIcon />}
                    onClick={() => setPwOpen(true)}
                    sx={{ border: "1px solid var(--glassBorder)", background: "var(--glassBg)", color: "var(--textPrimary)", "&:hover": { background: "var(--surfaceHover)" } }}
                  >
                    Password
                  </Button>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Stack direction="row" spacing={2} sx={{ alignItems: "stretch", flexWrap: "wrap" }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#8B5CF6" }}>{stats.xp ?? 0}</Typography>
                <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>XP</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: "var(--borderColor)" }} />
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#38BDF8" }}>{stats.level ?? 1}</Typography>
                <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Level</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: "var(--borderColor)" }} />
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#F97316" }}>{stats.streak_days ?? 0}</Typography>
                <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Day streak</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: "var(--borderColor)" }} />
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#22C55E" }}>{stats.labs_completed ?? 0}</Typography>
                <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>Labs done</Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Section>

      {/* ── Stat strip ───────────────────────────────────────────────────- */}
      <Section delay={0.1}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
          {statTiles.map((t) => (
            <Box key={t.key} sx={{ ...GLASS, p: 1.2, display: "flex", alignItems: "center", gap: 1.2, minWidth: 0, flex: "1 1 110px" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: `${t.color}1f`,
                  color: t.color,
                  flexShrink: 0,
                }}
              >
                <t.icon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "var(--textPrimary)", fontWeight: 800, fontSize: 16, lineHeight: 1.15 }}>{t.value}</Typography>
                <Typography sx={{ color: "var(--textMuted)", fontSize: 11.5, whiteSpace: "nowrap" }}>{t.label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Section>

      {/* ── Row: Security score / Personal ─────────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Security score */}
        <Box sx={{ flex: 1.35, minWidth: 0 }}>
          <Section delay={0.15}>
            <Box sx={CARD}>
              <CardTitle icon={<SpeedIcon />} color="#22C55E" title="Security Score" sub="Your account &amp; learning health" />
              {security ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                    <Box sx={{ position: "relative", flexShrink: 0 }}>
                      <Box
                        sx={{
                          width: 148,
                          height: 148,
                          borderRadius: "50%",
                          background: `conic-gradient(${scoreColor} ${score * 3.6}deg, var(--borderColor) 0deg)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 112,
                            height: 112,
                            borderRadius: "50%",
                            background: "var(--cardBg)",
                            border: "1px solid var(--borderColor)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography sx={{ fontSize: 32, fontWeight: 800, color: "var(--textPrimary)", lineHeight: 1 }}>{score}</Typography>
                          <Typography sx={{ fontSize: 11, color: "var(--textMuted)" }}>/100</Typography>
                        </Box>
                      </Box>
                      <Tooltip title={`Level: ${level}`}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: -6,
                            bgcolor: levelColor,
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 800,
                            px: 1,
                            py: 0.25,
                            borderRadius: 20,
                          }}
                        >
                          {level.toUpperCase()}
                        </Box>
                      </Tooltip>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 260 }}>
                      <Typography sx={{ color: "var(--textSecondary)", fontSize: 13, mb: 1.5 }}>
                        Scored against 4 security factors — password health, labs, learning and account safety.
                      </Typography>
                      {Object.entries(FACTOR_META).map(([key, meta]) => {
                        const val = security.factors?.[key] ?? 0;
                        const pct = Math.min(100, Math.round((val / meta.max) * 100));
                        return (
                          <Box key={key} sx={{ mb: 1.25 }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.35 }}>
                              <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", display: "flex", alignItems: "center", gap: 0.7 }}>
                                <meta.icon style={{ fontSize: 14 }} />
                                {meta.label}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>
                                {val}/{meta.max}
                              </Typography>
                            </Stack>
                            <Box sx={{ height: 6, borderRadius: 20, background: "var(--borderColor)", overflow: "hidden" }}>
                              <Box sx={{ width: `${pct}%`, height: "100%", borderRadius: 20, background: meta.color }} />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {security.recommendations?.length > 0 && (
                    <>
                      <Divider sx={{ borderColor: "var(--borderColor)", my: 2 }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                        <AutoAwesomeIcon fontSize="small" sx={{ color: "#A855F7" }} />
                        Recommendations
                      </Typography>
                      <Stack spacing={1}>
                        {security.recommendations.map((r, i) => (
                          <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                            <CheckCircleIcon fontSize="small" sx={{ color: "#10B981", mt: 0.25, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.4 }}>{r}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={recalcBusy ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
                      onClick={handleRecalc}
                      disabled={recalcBusy}
                      sx={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", color: "#fff", "&:hover": { filter: "brightness(1.08)" } }}
                    >
                      {recalcBusy ? "Calculating…" : "Recalculate Score"}
                    </Button>
                  </Box>
                </>
              ) : (
                <SectionEmpty icon={<InfoIcon />} title="Security score unavailable" sub="Refresh to recalculate." />
              )}
            </Box>
          </Section>
        </Box>

        {/* Personal & social */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.2}>
            <Box sx={CARD}>
              <CardTitle color="#38BDF8" title="About &amp; Social" icon={<BadgeIcon style={{ fontSize: 20 }} />} />
              {profile?.bio ? (
                <Typography sx={{ fontSize: 14, color: "var(--textSecondary)", lineHeight: 1.6, mb: 2 }}>{profile.bio}</Typography>
              ) : (
                <Typography sx={{ fontSize: 13.5, color: "var(--textMuted)", mb: 2 }}>
                  No bio yet — press <b>Edit Profile</b> to introduce yourself.
                </Typography>
              )}

              {personalRows.length > 0 && (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {personalRows.map((row) => (
                    <Stack key={row.label} direction="row" spacing={1} alignItems="center">
                      <row.icon fontSize="small" sx={{ color: "var(--textMuted)" }} />
                      <Typography sx={{ width: 68, fontSize: 13, color: "var(--textMuted)" }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{row.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}

              <Divider sx={{ borderColor: "var(--borderColor)", mb: 2 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
                Social links
              </Typography>
              {socialLinks.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {socialLinks.map((s) => (
                    <Button
                      key={s.label}
                      size="small"
                      startIcon={<s.icon size={15} />}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        border: "1px solid var(--glassBorder)",
                        background: "var(--glassBg)",
                        color: "var(--textSecondary)",
                        textTransform: "capitalize",
                        "&:hover": { borderColor: "#2563EB", background: "var(--surfaceHover)", color: "var(--text-primary)" },
                      }}
                    >
                      {s.label}
                    </Button>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>No social links added yet.</Typography>
              )}
            </Box>
          </Section>

          {/* Activity */}
          <Section delay={0.25}>
            <Box sx={{ ...CARD, mt: 2.5 }}>
              <CardTitle icon={<HistoryIcon style={{ fontSize: 20 }} />} color="#22C55E" title="Recent Activity" sub={activity ? `${activity.devices_used?.length ?? 0} devices, ${activity.total_logins ?? 0} total logins` : "Login history"} />
              {recentLogins.length > 0 ? (
                <Stack spacing={1}>
                  {recentLogins.slice(0, 5).map((entry) => {
                    const meta = STATUS_META[entry.status] || STATUS_META.success;
                    return (
                      <Box
                        key={entry.id}
                        sx={{
                          border: "1px solid var(--borderColor)",
                          borderRadius: 2,
                          px: 1.5,
                          py: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.4 }}>
                            <CastIcon sx={{ fontSize: 16, color: "var(--textMuted)" }} />
                            <Typography sx={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                              {entry.device?.slice(0, 30) || "Unknown device"}
                            </Typography>
                            <TimeLabel iso={entry.login_time} />
                          </Stack>
                          <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>
                            {entry.location || "Unknown location"} · {entry.ip_address || "—"}
                          </Typography>
                        </Box>
                        <Chip
                          label={meta.label}
                          size="small"
                          sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: `${meta.color}1f`, color: meta.color }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <SectionEmpty icon={<HistoryIcon />} title="No activity yet" sub="Your recent logins will appear here." />
              )}
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Row: Preferences + Account ──────────────────────────────────── */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} sx={{ mt: 2.5 }}>
        {/* Notifications & password */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.15}>
            <Box sx={CARD}>
              <CardTitle icon={<NotificationsActiveIcon style={{ fontSize: 20 }} />} color="#F59E0B" title="Preferences" />
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
                      bgcolor: "#F59E0B1f",
                      color: "#F59E0B",
                      flexShrink: 0,
                    }}
                  >
                    <item.icon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 600 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>{item.desc}</Typography>
                  </Box>
                  <Switch
                    checked={!!notif[item.key]}
                    onChange={() => toggleNotif(item.key)}
                    disabled={busyToggle === item.key}
                    size="small"
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#F59E0B" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#F59E0B" },
                    }}
                  />
                </Stack>
              ))}

              <Divider sx={{ borderColor: "var(--borderColor)", my: 1.5 }} />
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={isDark ? <Sun size={16} /> : <Moon size={16} />}
                  onClick={toggleTheme}
                  sx={{ color: "var(--textSecondary)", borderColor: "var(--borderStrong)", textTransform: "none" }}
                >
                  {isDark ? "Using Dark Theme — switch to light" : "Using Light Theme — switch to dark"}
                </Button>
              </Stack>
              <Divider sx={{ borderColor: "var(--borderColor)", my: 1.5 }} />
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<VpnKeyIcon />}
                onClick={() => setPwOpen(true)}
                sx={{ color: "var(--textSecondary)", borderColor: "var(--borderStrong)", textTransform: "none" }}
              >
                Change Password
              </Button>
            </Box>
          </Section>
        </Box>

        {/* Account Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Section delay={0.2}>
            <Box sx={CARD}>
              <CardTitle icon={<BadgeIcon style={{ fontSize: 20 }} />} color="#8B5CF6" title="Account Information" sub="Details tied to your CyberShield account" />
              <Stack spacing={1}>
                {accountRows.map((r) => (
                  <Stack key={r.label} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.4 }}>
                    <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>{r.label}</Typography>
                    <Typography sx={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600, textAlign: "right" }}>{r.value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Section>
        </Box>
      </Stack>

      {/* ── Dialogs ────────────────────────────────────────────────────── */}
      <EditProfileDialog open={editOpen} profile={profile} onClose={() => setEditOpen(false)} onSaved={handleProfileSave} />
      <PasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} onSaved={handlePasswordSaved} />
      {avatarOpen && (
        <AvatarDialog
          open={avatarOpen}
          onClose={() => setAvatarOpen(false)}
          onUpload={handleAvatarUpload}
          onDelete={handleAvatarDelete}
          hasAvatar={!!profile?.profile_image}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} sx={{ borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}