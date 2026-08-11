import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { keyframes } from "@emotion/react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Chip,
  Tooltip,
  Divider,
  Avatar,
  Skeleton,
  IconButton,
} from "@mui/material";
import {
  ArrowLeft,
  FolderGit2,
  Sun,
  Moon,
  RefreshCw,
  Users,
  FileText,
  ShieldAlert,
  GitBranch,
  CalendarDays,
  ClipboardCheck,
  Rocket,
  GitCompareArrows,
  Activity,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Clock,
  AlertTriangle,
  Settings2,
  Layers,
} from "lucide-react";
import { projectApi } from "../../api/projectApi";
import { useTheme } from "../../theme/useTheme";
import { scoreColor } from "../../components/ThreatDashboard/severity";
import RiskGauge from "../../components/Projects/RiskGauge";
import SectionCard from "../../components/Projects/SectionCard";
import KpiTile from "../../components/Projects/KpiTile";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const STATUS_META = {
  Active: { color: "#22C55E", bg: "rgba(34,197,94,0.14)", label: "Active" },
  "On Hold": { color: "#F59E0B", bg: "rgba(245,158,11,0.14)", label: "On Hold" },
  Archived: { color: "#94A3B8", bg: "rgba(148,163,184,0.16)", label: "Archived" },
  Review: { color: "#3B82F6", bg: "rgba(59,130,246,0.14)", label: "In Review" },
};

const ROLE_META = {
  Owner: { color: "#F59E0B", bg: "rgba(245,158,11,0.14)" },
  Admin: { color: "#8B5CF6", bg: "rgba(139,92,246,0.14)" },
  Developer: { color: "#3B82F6", bg: "rgba(59,130,246,0.14)" },
  Viewer: { color: "#94A3B8", bg: "rgba(148,163,184,0.16)" },
};

const ACTIVITY_ICONS = {
  "Project Created": { icon: FolderGit2, color: "#3B82F6" },
  "Project Updated": { icon: Settings2, color: "#8B5CF6" },
  "Threat Report Generated": { icon: FileText, color: "#E11D48" },
  "Comment Added": { icon: ClipboardCheck, color: "#22C55E" },
  "Comment Deleted": { icon: ClipboardCheck, color: "#F59E0B" },
  "Member Joined": { icon: Users, color: "#06B6D4" },
  "Member Removed": { icon: Users, color: "#EF4444" },
};

function ReportRow({ report, expanded, onToggle }) {
  const color = scoreColor(report.risk_score);
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${expanded ? `${color}66` : "var(--borderColor)"}`,
        background: expanded ? `${color}0d` : "var(--surfaceHover)",
        overflow: "hidden",
        transition: "border-color 200ms ease, background 200ms ease",
        "&:hover": { borderColor: `${color}66` },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 1.75,
          py: 1.5,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={onToggle}
      >
        <Box
          sx={{
            width: 8,
            height: 36,
            borderRadius: 99,
            bgcolor: color,
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 800,
              color: "var(--textPrimary)",
              lineHeight: 1.2,
            }}
          >
            Report Version {report.version}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
            <Clock size={12} style={{ color: "var(--textMuted)" }} />
            <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", fontWeight: 600 }}>
              {report.created_at
                ? new Date(report.created_at).toLocaleString()
                : "—"}
            </Typography>
          </Stack>
        </Box>
        <Chip
          label={report.risk_level || "Unknown"}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 800,
            color,
            bgcolor: `${color}1a`,
            border: `1px solid ${color}55`,
            "& .MuiChip-label": { px: 1.25 },
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "var(--textMuted)",
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 900, color }}>
            {report.risk_score}
          </Typography>
          <ChevronRight
            size={16}
            style={{
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform 200ms ease",
            }}
          />
        </Box>
      </Stack>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <Box sx={{ px: 1.75, pb: 1.75 }}>
              <Divider sx={{ borderColor: "var(--borderColor)", mb: 1.5 }} />
              <Stack spacing={1}>
                {Object.entries(report.detail || {}).length > 0 ? (
                  Object.entries(report.detail).slice(0, 6).map(([k, v]) => (
                    <Stack
                      key={k}
                      direction="row"
                      justifyContent="space-between"
                      sx={{ gap: 2 }}
                    >
                      <Typography
                        sx={{ fontSize: 12, color: "var(--textMuted)", fontWeight: 700, textTransform: "capitalize" }}
                      >
                        {k.replace(/_/g, " ")}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "var(--textPrimary)",
                          fontWeight: 600,
                          textAlign: "right",
                          wordBreak: "break-word",
                        }}
                      >
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </Typography>
                    </Stack>
                  ))
                ) : (
                  <Typography sx={{ fontSize: 12.5, color: "var(--textMuted)" }}>
                    No detailed findings stored for this version.
                  </Typography>
                )}
              </Stack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [p, r, m, a] = await Promise.all([
        projectApi.get(id),
        projectApi.listReports(id),
        projectApi.listMembers(id),
        projectApi.timeline(id),
      ]);
      setProject(p.data);
      setReports(r.data || []);
      setMembers(m.data || []);
      setActivities(a.data || []);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to load project");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleReport = async (report) => {
    if (expanded === report.id) {
      setExpanded(null);
      return;
    }
    setExpanded(report.id);
    if (!report.detail) {
      try {
        const { data } = await projectApi.getVersion(id, report.version);
        report.detail = data.data || {};
        setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, detail: report.detail } : r)));
      } catch {
        report.detail = {};
      }
    }
  };

  const status = STATUS_META[project?.status] || STATUS_META.Active;
  const techs = useMemo(
    () => (Array.isArray(project?.tech_stack) ? project.tech_stack : []),
    [project]
  );
  const hasRisk = project?.latest_risk_score != null;
  const riskColor = hasRisk ? scoreColor(project.latest_risk_score) : "#64748B";

  const goAnalyze = () =>
    navigate("/threat-analysis", { state: { project } });

  const quickActions = [
    {
      icon: <ClipboardCheck size={17} />,
      label: "Security Checklist",
      desc: "Run a project-specific checklist",
      color: "#2563EB",
      to: `/security-checklist/${id}`,
    },
    {
      icon: <Rocket size={17} />,
      label: "Run Threat Analysis",
      desc: "Scan this project for threats",
      color: "#8B5CF6",
      onClick: goAnalyze,
    },
    {
      icon: <GitCompareArrows size={17} />,
      label: "Compare Versions",
      desc: "Diff report versions side-by-side",
      color: "#06B6D4",
      to: `/projects/${id}/versions`,
    },
    {
      icon: <Activity size={17} />,
      label: "View Activity",
      desc: "Timeline and audit logs",
      color: "#22C55E",
      to: `/projects/${id}/timeline`,
    },
    {
      icon: <Users size={17} />,
      label: "Manage Team",
      desc: "Invite and manage members",
      color: "#F59E0B",
      to: `/projects/${id}/members`,
    },
  ];

  const renderHeader = () => (
    <>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
        <Button
          onClick={() => navigate("/projects")}
          startIcon={<ArrowLeft size={16} />}
          sx={{
            px: 1,
            py: 0.5,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--textSecondary)",
            "&:hover": { bgcolor: "var(--surfaceHover)", color: "var(--textPrimary)" },
          }}
        >
          Projects
        </Button>
        <ChevronRight size={14} style={{ color: "var(--textMuted)" }} />
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--textMuted)" }}>
          {project?.name || "Project"}
        </Typography>
      </Stack>

      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${riskColor} 0%, #7C3AED 100%)`,
              color: "#fff",
              boxShadow: `0 10px 30px ${riskColor}55`,
            }}
          >
            <FolderGit2 size={27} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" rowGap={0.5}>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  letterSpacing: "-0.02em",
                  color: "var(--textPrimary)",
                  fontSize: { xs: 24, md: 30 },
                  lineHeight: 1.15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {project?.name}
              </Typography>
              <Chip
                label={status.label}
                size="small"
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 800,
                  color: status.color,
                  bgcolor: status.bg,
                  border: `1px solid ${status.color}55`,
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            </Stack>
            <Typography
              sx={{
                color: "var(--textSecondary)",
                fontSize: 13.5,
                mt: 0.5,
                lineHeight: 1.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                maxWidth: 620,
              }}
            >
              {project?.description || "No description provided for this workspace."}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap" rowGap={1}>
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
                "&:hover": {
                  background: "var(--surfaceHover)",
                  color: "var(--textPrimary)",
                },
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
            onClick={() => load(true)}
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

          <Button
            variant="contained"
            startIcon={<Settings2 size={17} />}
            onClick={() => navigate(`/projects/${id}/details`)}
            sx={{
              background: "var(--glassBg)",
              color: "var(--textPrimary)",
              border: "1px solid var(--glassBorder)",
              boxShadow: "none",
              "&:hover": { background: "var(--surfaceHover)" },
            }}
          >
            Edit
          </Button>

          <Button
            variant="contained"
            startIcon={<Rocket size={17} />}
            onClick={goAnalyze}
            sx={{
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)",
              },
            }}
          >
            Run Analysis
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ borderColor: "var(--borderColor)" }} />
    </>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: 2.5, bgcolor: "var(--borderColor)" }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="40%" height={34} sx={{ bgcolor: "var(--borderColor)" }} />
              <Skeleton width="70%" height={18} sx={{ bgcolor: "var(--borderColor)" }} />
            </Box>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={86} sx={{ borderRadius: 2.5, bgcolor: "var(--borderColor)", transform: "none" }} />
            ))}
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
              gap: 2.5,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={420} sx={{ borderRadius: 3, bgcolor: "var(--borderColor)", transform: "none" }} />
            ))}
          </Box>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        {renderHeader()}
        <Box
          sx={{
            mt: 4,
            borderRadius: 3,
            border: "1px solid var(--dangerSoft)",
            bgcolor: "var(--dangerSoft)",
            color: "#EF4444",
            px: 3,
            py: 8,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(239,68,68,0.12)",
              color: "#EF4444",
            }}
          >
            <AlertTriangle size={28} />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800, color: "var(--textPrimary)" }}>
            Could not load this project
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "var(--textSecondary)", mt: 0.75 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => load()}
            sx={{
              mt: 2.5,
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
            }}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const latest = reports[0];
  const lastScan = latest?.created_at
    ? new Date(latest.created_at).toLocaleDateString()
    : "No scans yet";

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {renderHeader()}

      {/* ── KPI row ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
          mt: 2.5,
        }}
      >
        <KpiTile
          icon={<ShieldAlert size={20} />}
          color={riskColor}
          value={hasRisk ? project.latest_risk_score : "—"}
          label="Current Risk Score"
          hint={project.latest_risk_level ? `Level · ${project.latest_risk_level}` : "No score yet"}
        />
        <KpiTile
          icon={<FileText size={20} />}
          color="#6366F1"
          value={reports.length}
          label="Security Reports"
          hint={reports.length ? `${reports.length} version${reports.length === 1 ? "" : "s"} generated` : "No reports yet"}
        />
        <KpiTile
          icon={<Users size={20} />}
          color="#8B5CF6"
          value={project.member_count ?? members.length}
          label="Team Members"
          hint={project.owner_id ? "Collaborative workspace" : ""}
        />
        <KpiTile
          icon={<CalendarDays size={20} />}
          color="#06B6D4"
          value={lastScan}
          label="Last Scan"
          hint="Latest report date"
        />
      </Box>

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
          gap: 2.5,
          mt: 2.5,
        }}
      >
        {/* Left: posture + reports */}
        <Box sx={{ gridColumn: { lg: "span 2" }, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SectionCard
              icon={<ShieldCheck size={17} />}
              iconColor="#22C55E"
              title="Security Posture"
              action={
                project.repo_url ? (
                  <Tooltip title="Open repository">
                    <IconButton
                      size="small"
                      component="a"
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "var(--textSecondary)", "&:hover": { color: "var(--textPrimary)" } }}
                    >
                      <ExternalLink size={16} />
                    </IconButton>
                  </Tooltip>
                ) : undefined
              }
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }}>
                <Box sx={{ flexShrink: 0 }}>
                  <RiskGauge score={project.latest_risk_score} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                    {techs.length > 0 ? (
                      techs.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "var(--textSecondary)",
                            bgcolor: "var(--surfaceHover)",
                            border: "1px solid var(--borderColor)",
                            "& .MuiChip-label": { px: 1.25 },
                          }}
                        />
                      ))
                    ) : (
                      <Chip
                        label="Tech stack not specified"
                        size="small"
                        sx={{ height: 24, fontSize: 11.5, color: "var(--textMuted)" }}
                      />
                    )}
                  </Stack>

                  <Box
                    sx={{
                      mt: 2,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                      gap: 1.5,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Status
                      </Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--textPrimary)", mt: 0.25 }}>
                        {status.label}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Created
                      </Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--textPrimary)", mt: 0.25 }}>
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Reports
                      </Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--textPrimary)", mt: 0.25 }}>
                        {reports.length} version{reports.length === 1 ? "" : "s"}
                      </Typography>
                    </Box>
                  </Box>

                  {project.repo_url && (
                    <Box
                      component="a"
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        mt: 2,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1.5,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#3B82F6",
                        bgcolor: "rgba(59,130,246,0.10)",
                        border: "1px solid rgba(59,130,246,0.25)",
                        textDecoration: "none",
                        "&:hover": { bgcolor: "rgba(59,130,246,0.16)" },
                      }}
                    >
                      <GitBranch size={14} />
                      {project.repo_url.replace(/^https?:\/\/(www\.)?/, "")}
                    </Box>
                  )}
                </Box>
              </Stack>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <SectionCard
              icon={<Layers size={17} />}
              iconColor="#6366F1"
              title="Security Reports"
              action={
                reports.length > 0 ? (
                  <Button
                    size="small"
                    onClick={() => navigate(`/projects/${id}/versions`)}
                    sx={{ fontSize: 12, fontWeight: 800, color: "#2563EB", "&:hover": { bgcolor: "rgba(37,99,235,0.10)" } }}
                  >
                    View All
                  </Button>
                ) : undefined
              }
            >
              {reports.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      mx: "auto",
                      mb: 1.5,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(99,102,241,0.10)",
                      color: "#6366F1",
                    }}
                  >
                    <FileText size={26} />
                  </Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--textPrimary)" }}>
                    No security reports yet
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", mt: 0.5, maxWidth: 340, mx: "auto", lineHeight: 1.55 }}>
                    Run a threat analysis to generate your first report version for this project.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Rocket size={16} />}
                    onClick={goAnalyze}
                    sx={{
                      mt: 2,
                      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                      color: "#fff",
                      "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
                    }}
                  >
                    Run Threat Analysis
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {reports.slice(0, 5).map((r) => (
                    <ReportRow
                      key={r.id}
                      report={r}
                      expanded={expanded === r.id}
                      onToggle={() => toggleReport(r)}
                    />
                  ))}
                  {reports.length > 5 && (
                    <Button
                      size="small"
                      onClick={() => navigate(`/projects/${id}/versions`)}
                      sx={{ alignSelf: "flex-start", fontSize: 12.5, fontWeight: 800, color: "#2563EB", mt: 0.5 }}
                    >
                      See all {reports.length} versions →
                    </Button>
                  )}
                </Stack>
              )}
            </SectionCard>
          </motion.div>
        </Box>

        {/* Right: team, activity, quick actions */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <SectionCard
              icon={<Users size={17} />}
              iconColor="#8B5CF6"
              title="Team Members"
              action={
                <Button
                  size="small"
                  onClick={() => navigate(`/projects/${id}/members`)}
                  sx={{ fontSize: 12, fontWeight: 800, color: "#8B5CF6", "&:hover": { bgcolor: "rgba(139,92,246,0.10)" } }}
                >
                  Manage
                </Button>
              }
            >
              {members.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                  No members yet. Invite teammates to collaborate.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {members.slice(0, 5).map((m) => {
                    const role = ROLE_META[m.role] || ROLE_META.Viewer;
                    const initials = (m.user_name || "?")
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <Stack key={m.id} direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#fff",
                            bgcolor: "linear-gradient(135deg, #2563EB, #7C3AED)",
                            background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "var(--textPrimary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.user_name}
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {m.email || "—"}
                          </Typography>
                        </Box>
                        <Chip
                          label={m.role}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: role.color,
                            bgcolor: role.bg,
                            border: `1px solid ${role.color}55`,
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      </Stack>
                    );
                  })}
                  {members.length > 5 && (
                    <Button
                      size="small"
                      onClick={() => navigate(`/projects/${id}/members`)}
                      sx={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 800, color: "#8B5CF6", mt: 0.25 }}
                    >
                      +{members.length - 5} more members
                    </Button>
                  )}
                </Stack>
              )}
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SectionCard
              icon={<Activity size={17} />}
              iconColor="#06B6D4"
              title="Recent Activity"
              action={
                activities.length > 0 ? (
                  <Button
                    size="small"
                    onClick={() => navigate(`/projects/${id}/timeline`)}
                    sx={{ fontSize: 12, fontWeight: 800, color: "#06B6D4", "&:hover": { bgcolor: "rgba(6,182,212,0.10)" } }}
                  >
                    Timeline
                  </Button>
                ) : undefined
              }
            >
              {activities.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                  No activity recorded yet for this project.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {activities.slice(0, 5).map((a, i) => {
                    const meta = ACTIVITY_ICONS[a.action] || { icon: Activity, color: "#64748B" };
                    const Icon = meta.icon;
                    return (
                      <Stack key={a.id || i} direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.75,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: `${meta.color}1a`,
                            color: meta.color,
                          }}
                        >
                          <Icon size={15} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "var(--textPrimary)", lineHeight: 1.3 }}>
                            {a.action}
                          </Typography>
                          {a.detail && (
                            <Typography sx={{ fontSize: 11.5, color: "var(--textSecondary)", mt: 0.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                              {a.detail}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: 10.5, color: "var(--textMuted)", mt: 0.25, fontWeight: 600 }}>
                            {a.user_name}
                            {a.created_at ? ` · ${new Date(a.created_at).toLocaleDateString()}` : ""}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
          >
            <SectionCard
              icon={<Rocket size={17} />}
              iconColor="#F59E0B"
              title="Quick Actions"
            >
              <Stack spacing={1}>
                {quickActions.map((qa) => (
                  <Box
                    key={qa.label}
                    role="button"
                    tabIndex={0}
                    onClick={() => (qa.onClick ? qa.onClick() : navigate(qa.to))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        qa.onClick ? qa.onClick() : navigate(qa.to);
                      }
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2,
                      cursor: "pointer",
                      background: "var(--surfaceHover)",
                      border: "1px solid var(--borderColor)",
                      transition: "border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease",
                      "&:hover": {
                        borderColor: `${qa.color}66`,
                        boxShadow: "var(--shadowSoft)",
                        transform: "translateY(-1px)",
                        "& .qa-chevron": { transform: "translateX(2px)", opacity: 1 },
                      },
                      "&:focus-visible": { outline: "2px solid var(--primary)" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1.75,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: `${qa.color}1a`,
                        color: qa.color,
                      }}
                    >
                      {qa.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--textPrimary)" }}>
                        {qa.label}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                        {qa.desc}
                      </Typography>
                    </Box>
                    <ChevronRight
                      size={16}
                      className="qa-chevron"
                      style={{ color: "var(--textMuted)", opacity: 0.5, transition: "all 200ms ease" }}
                    />
                  </Box>
                ))}
              </Stack>
            </SectionCard>
          </motion.div>
        </Box>
      </Box>
    </Container>
  );
}
