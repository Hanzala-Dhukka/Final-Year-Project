import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Avatar,
  Stack,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Skeleton,
} from "@mui/material";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Search,
  RefreshCw,
  Sun,
  Moon,
  Trash2,
  Eye,
  Target,
  BrainCircuit,
  GitBranch,
  Server,
  Swords,
  UserX,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Database,
} from "lucide-react";
import { useTheme as useAppTheme } from "../../theme/useTheme";
import {
  adminGetDashboard,
  adminGetAllUsers,
  adminSearchUsers,
  adminChangeUserRole,
  adminChangeUserStatus,
  adminDeleteUser,
  adminGetUserActivity,
  adminGetSecurityMonitoring,
  adminGetRecentActivities,
} from "../../api/api";

const ROLES = ["student", "instructor", "admin"];
const STATUSES = ["active", "blocked", "suspended"];

const AVATAR_COLORS = ["#2563EB", "#06B6D4", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"];

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function statusColor(status) {
  switch (status) {
    case "active":
      return { color: "var(--success)", soft: "var(--successSoft)" };
    case "blocked":
      return { color: "var(--danger)", soft: "var(--dangerSoft)" };
    case "suspended":
      return { color: "var(--warning)", soft: "var(--warningSoft)" };
    default:
      return { color: "var(--neutral)", soft: "var(--neutralSoft)" };
  }
}

function roleColor(role) {
  switch (role) {
    case "admin":
      return { color: "var(--primary)", soft: "var(--infoSoft)" };
    case "instructor":
      return { color: "var(--accentCyan)", soft: "var(--infoSoft)" };
    default:
      return { color: "var(--neutral)", soft: "var(--neutralSoft)" };
  }
}

function moduleColor(module) {
  switch ((module || "").toUpperCase()) {
    case "ADMIN":
      return { color: "var(--primary)", soft: "var(--infoSoft)" };
    case "AUTH":
      return { color: "var(--accentCyan)", soft: "var(--infoSoft)" };
    case "SCANNER":
      return { color: "var(--success)", soft: "var(--successSoft)" };
    default:
      return { color: "var(--neutral)", soft: "var(--neutralSoft)" };
  }
}

function StatCard({ icon: Icon, label, value, accent, caption, loading }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: "100%",
        bgcolor: "var(--cardBg)",
        border: "1px solid var(--borderColor)",
        borderRadius: 3,
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        transition: "border-color .2s, transform .2s",
        "&:hover": { borderColor: "var(--borderStrong)", transform: "translateY(-2px)" },
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "var(--infoSoft)",
          color: accent || "var(--primary)",
          flexShrink: 0,
        }}
      >
        <Icon size={22} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={70} height={34} sx={{ mt: 0.5 }} />
        ) : (
          <Typography sx={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, color: accent || "var(--textPrimary)", mt: 0.25 }}>
            {value ?? 0}
          </Typography>
        )}
        {caption && (
          <Typography sx={{ fontSize: 11, color: "var(--textMuted)", mt: 0.25, lineHeight: 1.4 }}>{caption}</Typography>
        )}
      </Box>
    </Paper>
  );
}

function PanelHeader({ icon: Icon, title, sub, action }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 2, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "var(--infoSoft)",
            color: "var(--primary)",
            flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--textPrimary)" }}>{title}</Typography>
          {sub && <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>{sub}</Typography>}
        </Box>
      </Box>
      {action}
    </Box>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <Icon size={38} style={{ color: "var(--textMuted)", opacity: 0.5, margin: "0 auto 12px" }} />
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "var(--textSecondary)" }}>{title}</Typography>
      {sub && <Typography sx={{ fontSize: 12.5, color: "var(--textMuted)", mt: 0.5 }}>{sub}</Typography>}
    </Box>
  );
}

const TAB_META = {
  overview: { label: "Overview", icon: TrendingUp },
  users: { label: "Users", icon: Users },
  security: { label: "Security", icon: ShieldCheck },
  activity: { label: "Activity Log", icon: Activity },
};

function AdminDashboard() {
  const { isDark, toggleTheme } = useAppTheme();

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statistics, setStatistics] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [confirm, setConfirm] = useState(null);
  const [activityView, setActivityView] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminGetDashboard();
      setStatistics(data.statistics || null);
      setMonitoring(data.security_monitoring || null);
      setRecentUsers(data.recent_users || []);
      setRecentActivities(data.recent_activities || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const { data } = await adminGetAllUsers(page * rowsPerPage, rowsPerPage);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (err) {
      setUsersError(err.response?.data?.detail || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, [page, rowsPerPage]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setPage(0);
      loadUsers();
      return;
    }
    setUsersLoading(true);
    setUsersError("");
    try {
      const { data } = await adminSearchUsers(q);
      setUsers(data.users || []);
      setUsersTotal(data.count || data.users?.length || 0);
    } catch (err) {
      setUsersError(err.response?.data?.detail || "Search failed.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setPage(0);
    loadUsers();
  };

  const viewActivity = async (user) => {
    setActivityLoading(true);
    setActivityView({ user, data: null });
    try {
      const { data } = await adminGetUserActivity(user.id);
      setActivityView({ user, data });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load activity.");
      setActivityView(null);
    } finally {
      setActivityLoading(false);
    }
  };

  const confirmAction = (payload) => setConfirm(payload);

  const runConfirm = async () => {
    if (!confirm) return;
    const { onConfirm } = confirm;
    setConfirm(null);
    await onConfirm();
  };

  const changeRole = (user, role) =>
    confirmAction({
      title: "Change user role",
      message: `Change ${user.name}'s role to "${role}"?`,
      confirmLabel: "Update Role",
      async onConfirm() {
        try {
          await adminChangeUserRole(user.id, role);
          toast.success("Role updated");
          loadUsers();
        } catch (err) {
          toast.error(err.response?.data?.detail || "Failed to update role.");
        }
      },
    });

  const changeStatus = (user, status) =>
    confirmAction({
      title: "Change account status",
      message: `Set ${user.name}'s account to "${status}"?`,
      confirmLabel: "Update Status",
      async onConfirm() {
        try {
          await adminChangeUserStatus(user.id, status);
          toast.success(`Account ${status}`);
          loadUsers();
        } catch (err) {
          toast.error(err.response?.data?.detail || "Failed to update status.");
        }
      },
    });

  const removeUser = (user) =>
    confirmAction({
      title: "Delete user",
      message: `Permanently delete ${user.name} (${user.email})? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      async onConfirm() {
        try {
          await adminDeleteUser(user.id);
          toast.success("User deleted");
          loadUsers();
        } catch (err) {
          toast.error(err.response?.data?.detail || "Failed to delete user.");
        }
      },
    });

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab, loadUsers]);

  const loadSecurity = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminGetSecurityMonitoring();
      setMonitoring(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load security data.");
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminGetRecentActivities(50);
      setRecentActivities(data.activities || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  const openTab = (next) => {
    setTab(next);
    if (next === "security") loadSecurity();
    if (next === "activity") loadActivities();
  };

  const kpis = useMemo(() => statistics || {}, [statistics]);
  const mon = useMemo(() => monitoring || {}, [monitoring]);

  const activePct = kpis.total_users ? Math.round(((kpis.active_users || 0) / kpis.total_users) * 100) : 0;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      {/* ===== Page header ===== */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, var(--primary), var(--accentPurple))",
                color: "#fff",
                boxShadow: "var(--glow)",
              }}
            >
              <ShieldCheck size={22} />
            </Box>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: "var(--textPrimary)", letterSpacing: -0.3 }}>
              Admin Control Center
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
            Platform-wide user management, security posture and audit monitoring.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={() => {
                if (tab === "users") loadUsers();
                else if (tab === "security") loadSecurity();
                else if (tab === "activity") loadActivities();
                else loadDashboard();
              }}
              sx={{ color: "var(--textSecondary)", border: "1px solid var(--borderColor)", borderRadius: 2 }}
            >
              <RefreshCw size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              sx={{ color: "var(--textSecondary)", border: "1px solid var(--borderColor)", borderRadius: 2 }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ===== Tabs ===== */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          mb: 3,
          p: 0.5,
          bgcolor: "var(--surfaceHover)",
          border: "1px solid var(--borderColor)",
          borderRadius: 3,
          width: "fit-content",
        }}
      >
        {Object.entries(TAB_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const active = tab === key;
          return (
            <Button
              key={key}
              startIcon={<Icon size={16} />}
              onClick={() => openTab(key)}
              sx={{
                px: 2.25,
                py: 1,
                borderRadius: 2.5,
                color: active ? "var(--textInverse)" : "var(--textSecondary)",
                bgcolor: active ? "var(--primary)" : "transparent",
                fontWeight: 600,
                fontSize: 13,
                textTransform: "none",
                boxShadow: active ? "var(--shadowSoft)" : "none",
                "&:hover": { bgcolor: active ? "var(--primary)" : "var(--neutralSoft)", color: active ? "#fff" : "var(--textPrimary)" },
              }}
            >
              {meta.label}
            </Button>
          );
        })}
      </Box>

      {/* ===== Error banner ===== */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2.5, bgcolor: "var(--dangerSoft)", color: "var(--danger)", border: "1px solid var(--borderColor)" }}
          action={
            <Button color="error" size="small" onClick={loadDashboard}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* =================================================================
          OVERVIEW
      ================================================================= */}
      {tab === "overview" && (
        <Stack spacing={3}>
          {/* KPI cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={Users} label="Total Users" value={kpis.total_users} caption={`${activePct}% active`} accent="var(--primary)" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={UserCheck} label="Active Users" value={kpis.active_users} caption={`${kpis.inactive_users || 0} inactive`} accent="var(--success)" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={Server} label="Total Scans" value={kpis.total_scans} caption={`${kpis.github_scans || 0} GitHub · ${kpis.security_scans || 0} security`} accent="var(--accentCyan)" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={ShieldAlert} label="Critical Issues" value={kpis.critical_issues} caption={`${kpis.high_issues || 0} high severity`} accent="var(--danger)" loading={loading} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={Swords} label="OWASP Labs" value={kpis.owasp_attempts} caption="Total lab attempts" accent="var(--accentPurple)" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={BrainCircuit} label="Quiz Attempts" value={kpis.quiz_attempts} caption="Total quiz submissions" accent="var(--warning)" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={UserX} label="Inactive Users" value={kpis.inactive_users} caption="Not currently active" accent="var(--warning)" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={AlertTriangle} label="High Issues" value={kpis.high_issues} caption="Across all scans" accent="var(--warning)" loading={loading} />
            </Grid>
          </Grid>

          {/* Security monitoring */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2.5, height: "100%", bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
                <PanelHeader icon={GitBranch} title="GitHub Scanner" sub="Repository security scans" />
                <Stack spacing={1.5}>
                  {[
                    { label: "Total scans", value: mon.github_scanner?.total_scans, color: "var(--accentCyan)" },
                    { label: "Critical issues", value: mon.github_scanner?.critical_issues, color: "var(--danger)" },
                    { label: "High issues", value: mon.github_scanner?.high_issues, color: "var(--warning)" },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--borderColor)", pb: 1.25 }}>
                      <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: row.color }}>
                        {loading ? <Skeleton width={40} height={26} /> : (row.value ?? 0)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2.5, height: "100%", bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
                <PanelHeader icon={Target} title="Security Scanner" sub="Website security checks" />
                <Stack spacing={1.5}>
                  {[
                    { label: "Websites checked", value: mon.security_scanner?.websites_checked, color: "var(--success)" },
                    { label: "Critical alerts", value: mon.security_scanner?.critical_alerts, color: "var(--danger)" },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--borderColor)", pb: 1.25 }}>
                      <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: row.color }}>
                        {loading ? <Skeleton width={40} height={26} /> : (row.value ?? 0)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2.5, height: "100%", bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
                <PanelHeader icon={Swords} title="OWASP Simulator" sub="Attack simulation labs" />
                <Stack spacing={1.5}>
                  {[
                    { label: "Total attempts", value: mon.owasp_simulator?.total_attempts, color: "var(--accentPurple)" },
                    { label: "SQL injection", value: mon.owasp_simulator?.sql_injection_attempts, color: "var(--danger)" },
                    { label: "XSS attempts", value: mon.owasp_simulator?.xss_attempts, color: "var(--warning)" },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--borderColor)", pb: 1.25 }}>
                      <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: row.color }}>
                        {loading ? <Skeleton width={40} height={26} /> : (row.value ?? 0)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent users + activities */}
          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
                <PanelHeader
                  icon={Users}
                  title="Recent Users"
                  sub={`${kpis.total_users || 0} total accounts`}
                  action={
                    <Button size="small" onClick={() => openTab("users")} sx={{ color: "var(--primary)", fontWeight: 600, textTransform: "none" }}>
                      View all
                    </Button>
                  }
                />
                {loading ? (
                  <Stack spacing={1}>
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={46} sx={{ borderRadius: 2 }} />)}
                  </Stack>
                ) : recentUsers.length === 0 ? (
                  <EmptyState icon={Users} title="No users yet" sub="New accounts will appear here." />
                ) : (
                  <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: "var(--borderColor)", py: 1.25 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>User</TableCell>
                          <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Role</TableCell>
                          <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Status</TableCell>
                          <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Last Login</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentUsers.map((u) => (
                          <TableRow key={u.id} sx={{ "&:hover": { bgcolor: "var(--surfaceHover)" } }}>
                            <TableCell>
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: avatarColor(u.name) }}>{initials(u.name)}</Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--textPrimary)", lineHeight: 1.2 }}>{u.name}</Typography>
                                  <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }} noWrap>{u.email}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={u.role} sx={{ color: roleColor(u.role).color, bgcolor: roleColor(u.role).soft, fontWeight: 700, fontSize: 11 }} />
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={u.status} sx={{ color: statusColor(u.status).color, bgcolor: statusColor(u.status).soft, fontWeight: 700, fontSize: 11 }} />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 12, color: "var(--textSecondary)" }}>{formatDate(u.last_login)}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper elevation={0} sx={{ p: 2.5, height: "100%", bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
                <PanelHeader icon={Activity} title="Recent Activity" sub="Latest audit events" />
                {loading ? (
                  <Stack spacing={1}>
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={44} sx={{ borderRadius: 2 }} />)}
                  </Stack>
                ) : recentActivities.length === 0 ? (
                  <EmptyState icon={Activity} title="No activity yet" sub="Audit events will appear here." />
                ) : (
                  <Stack spacing={1.25}>
                    {recentActivities.slice(0, 8).map((a) => (
                      <Box key={a.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            mt: 0.7,
                            flexShrink: 0,
                            bgcolor: a.status === "SUCCESS" ? "var(--success)" : "var(--danger)",
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 12.5, color: "var(--textPrimary)", lineHeight: 1.4 }}>
                            <strong>{a.username || "System"}</strong> {a.description || a.action}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "var(--textMuted)", mt: 0.25 }}>
                            {formatDate(a.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}

      {/* =================================================================
          USERS
      ================================================================= */}
      {tab === "users" && (
        <Paper elevation={0} sx={{ p: 2.5, bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
          <PanelHeader
            icon={Users}
            title="User Management"
            sub={`${usersTotal} registered accounts`}
            action={
              <Button size="small" startIcon={<Database size={14} />} onClick={handleReset} sx={{ color: "var(--textSecondary)", border: "1px solid var(--borderColor)", borderRadius: 2, textTransform: "none" }}>
                Reset
              </Button>
            }
          />

          {/* Search */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{
                maxWidth: { sm: 420 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "var(--bgPrimary)",
                  color: "var(--textPrimary)",
                  "& fieldset": { borderColor: "var(--borderColor)" },
                  "&:hover fieldset": { borderColor: "var(--borderStrong)" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={17} style={{ color: "var(--textMuted)" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<Search size={16} />}
              onClick={handleSearch}
              sx={{ bgcolor: "var(--primary)", borderRadius: 2.5, textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "var(--primaryHover)" } }}
            >
              Search
            </Button>
          </Stack>

          {usersError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, bgcolor: "var(--dangerSoft)", color: "var(--danger)" }}>
              {usersError}
            </Alert>
          )}

          {usersLoading ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} height={52} sx={{ borderRadius: 2 }} />)}
            </Stack>
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No users found" sub="Try a different search term." />
          ) : (
            <TableContainer sx={{ border: "1px solid var(--borderColor)", borderRadius: 2.5 }}>
              <Table sx={{ "& .MuiTableCell-root": { borderColor: "var(--borderColor)", py: 1.4 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "var(--surfaceHover)" }}>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>User</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Role</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Status</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Last Login</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const rc = roleColor(u.role);
                    const sc = statusColor(u.status);
                    return (
                      <TableRow key={u.id} sx={{ "&:hover": { bgcolor: "var(--surfaceHover)" } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: avatarColor(u.name) }}>{initials(u.name)}</Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "var(--textPrimary)", lineHeight: 1.2 }}>{u.name}</Typography>
                              <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }} noWrap>{u.email}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={u.role}
                            onChange={(e) => changeRole(u, e.target.value)}
                            sx={{
                              minWidth: 110,
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: rc.color,
                              borderRadius: 2,
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--borderColor)" },
                              "& .MuiSvgIcon-root": { color: "var(--textMuted)" },
                            }}
                          >
                            {ROLES.map((r) => (
                              <MenuItem key={r} value={r} sx={{ fontSize: 12.5 }}>{r}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={u.status} sx={{ color: sc.color, bgcolor: sc.soft, fontWeight: 700, fontSize: 11 }} />
                            <Select
                              size="small"
                              value=""
                              displayEmpty
                              onChange={(e) => e.target.value && changeStatus(u, e.target.value)}
                              renderValue={() => "Change"}
                              sx={{
                                minWidth: 86,
                                fontSize: 11.5,
                                color: "var(--textSecondary)",
                                borderRadius: 2,
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--borderColor)" },
                              }}
                            >
                              {STATUSES.map((s) => (
                                <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>{s}</MenuItem>
                              ))}
                            </Select>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, color: "var(--textSecondary)" }}>{formatDate(u.last_login)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View activity">
                              <IconButton size="small" onClick={() => viewActivity(u)} sx={{ color: "var(--primary)" }}>
                                <Eye size={17} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete user">
                              <IconButton size="small" onClick={() => removeUser(u)} sx={{ color: "var(--danger)" }}>
                                <Trash2 size={17} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!searchQuery.trim() && !usersLoading && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <TablePagination
                component="div"
                count={usersTotal}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ color: "var(--textSecondary)", "& .MuiSvgIcon-root": { color: "var(--textMuted)" } }}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* =================================================================
          SECURITY
      ================================================================= */}
      {tab === "security" && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: "100%", bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
              <PanelHeader icon={GitBranch} title="GitHub Scanner" sub="Repository security scans" />
              <Stack spacing={1.75}>
                {[
                  { label: "Total scans", value: mon.github_scanner?.total_scans, color: "var(--accentCyan)" },
                  { label: "Critical issues", value: mon.github_scanner?.critical_issues, color: "var(--danger)" },
                  { label: "High issues", value: mon.github_scanner?.high_issues, color: "var(--warning)" },
                ].map((row) => (
                  <Box key={row.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: row.color }}>
                        {loading ? <Skeleton width={36} height={24} /> : (row.value ?? 0)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: "100%", bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
              <PanelHeader icon={Target} title="Security Scanner" sub="Website security checks" />
              <Stack spacing={1.75}>
                {[
                  { label: "Websites checked", value: mon.security_scanner?.websites_checked, color: "var(--success)" },
                  { label: "Critical alerts", value: mon.security_scanner?.critical_alerts, color: "var(--danger)" },
                ].map((row) => (
                  <Box key={row.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: row.color }}>
                        {loading ? <Skeleton width={36} height={24} /> : (row.value ?? 0)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: "100%", bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
              <PanelHeader icon={Swords} title="OWASP Simulator" sub="Attack simulation labs" />
              <Stack spacing={1.75}>
                {[
                  { label: "Total attempts", value: mon.owasp_simulator?.total_attempts, color: "var(--accentPurple)" },
                  { label: "SQL injection", value: mon.owasp_simulator?.sql_injection_attempts, color: "var(--danger)" },
                  { label: "XSS attempts", value: mon.owasp_simulator?.xss_attempts, color: "var(--warning)" },
                ].map((row) => (
                  <Box key={row.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: row.color }}>
                        {loading ? <Skeleton width={36} height={24} /> : (row.value ?? 0)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* =================================================================
          ACTIVITY LOG
      ================================================================= */}
      {tab === "activity" && (
        <Paper elevation={0} sx={{ p: 2.5, bgcolor: "var(--cardBg)", border: "1px solid var(--borderColor)", borderRadius: 3 }}>
          <PanelHeader icon={Activity} title="Audit Activity Log" sub="Latest platform events across all modules" />
          {loading ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} height={56} sx={{ borderRadius: 2 }} />)}
            </Stack>
          ) : recentActivities.length === 0 ? (
            <EmptyState icon={Activity} title="No activity recorded" sub="Audit events will show up here." />
          ) : (
            <TableContainer sx={{ border: "1px solid var(--borderColor)", borderRadius: 2.5 }}>
              <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: "var(--borderColor)", py: 1.3 } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "var(--surfaceHover)" }}>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>User</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Module</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Action</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Description</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Status</TableCell>
                    <TableCell sx={{ color: "var(--textMuted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase" }}>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentActivities.map((a) => {
                    const mc = moduleColor(a.module);
                    const ok = a.status === "SUCCESS";
                    return (
                      <TableRow key={a.id} sx={{ "&:hover": { bgcolor: "var(--surfaceHover)" } }}>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--textPrimary)" }}>{a.username || "System"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={(a.module || "—").toUpperCase()} sx={{ color: mc.color, bgcolor: mc.soft, fontWeight: 700, fontSize: 11 }} />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", fontFamily: "monospace" }}>{a.action || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)" }}>{a.description || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                            label={ok ? "SUCCESS" : "FAILED"}
                            sx={{ color: ok ? "var(--success)" : "var(--danger)", bgcolor: ok ? "var(--successSoft)" : "var(--dangerSoft)", fontWeight: 700, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, color: "var(--textMuted)" }}>{formatDate(a.timestamp)}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ===== Confirm dialog ===== */}
      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        PaperProps={{ sx: { bgcolor: "var(--cardBg)", color: "var(--textPrimary)", borderRadius: 3, border: "1px solid var(--borderColor)", maxWidth: 440 } }}
      >
        {confirm && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                {confirm.danger ? <AlertTriangle size={20} style={{ color: "var(--danger)" }} /> : <ShieldCheck size={20} style={{ color: "var(--primary)" }} />}
                {confirm.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: "var(--textSecondary)", fontSize: 14 }}>{confirm.message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setConfirm(null)} sx={{ color: "var(--textSecondary)", borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={runConfirm}
                sx={{
                  bgcolor: confirm.danger ? "var(--danger)" : "var(--primary)",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: confirm.danger ? "#dc2626" : "var(--primaryHover)" },
                }}
              >
                {confirm.confirmLabel}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ===== User activity dialog ===== */}
      <Dialog
        open={Boolean(activityView)}
        onClose={() => setActivityView(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: "var(--cardBg)", color: "var(--textPrimary)", borderRadius: 3, border: "1px solid var(--borderColor)" } }}
      >
        {activityView && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 38, height: 38, fontSize: 14, bgcolor: avatarColor(activityView.user.name) }}>
                  {initials(activityView.user.name)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{activityView.user.name}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: "var(--textMuted)" }}>{activityView.user.email}</Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              {activityLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress size={30} sx={{ color: "var(--primary)" }} />
                </Box>
              ) : activityView.data ? (
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  {[
                    { label: "GitHub Scans", value: activityView.data.github_scans, icon: GitBranch, color: "var(--accentCyan)" },
                    { label: "Security Scans", value: activityView.data.security_scans, icon: Target, color: "var(--success)" },
                    { label: "Quiz Attempts", value: activityView.data.quiz_attempts, icon: BrainCircuit, color: "var(--warning)" },
                    { label: "OWASP Labs", value: activityView.data.owasp_attempts, icon: Swords, color: "var(--accentPurple)" },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <Grid item xs={6} sm={3} key={card.label}>
                        <Box sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "var(--surfaceHover)", border: "1px solid var(--borderColor)", textAlign: "center" }}>
                          <Icon size={18} style={{ color: card.color, margin: "0 auto 6px" }} />
                          <Typography sx={{ fontSize: 24, fontWeight: 800, color: card.color, lineHeight: 1.1 }}>{card.value ?? 0}</Typography>
                          <Typography sx={{ fontSize: 10.5, color: "var(--textMuted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, mt: 0.5 }}>
                            {card.label}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1.5, borderColor: "var(--borderColor)" }} />
                    <Stack spacing={1}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>Total activities</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--textPrimary)" }}>{activityView.data.total_activities ?? 0}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: 13, color: "var(--textSecondary)" }}>Last login</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--textPrimary)" }}>{formatDate(activityView.data.last_login)}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              ) : (
                <EmptyState icon={Activity} title="No activity data" sub="This user has no recorded activity." />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setActivityView(null)} sx={{ color: "var(--textSecondary)", borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;