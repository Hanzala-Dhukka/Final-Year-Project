import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  FolderGit2,
  Users,
  FileText,
  ShieldAlert,
  GitBranch,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { scoreColor } from "../ThreatDashboard/severity";

const STATUS_META = {
  Active: { color: "#22C55E", bg: "rgba(34,197,94,0.14)", label: "Active" },
  "On Hold": { color: "#F59E0B", bg: "rgba(245,158,11,0.14)", label: "On Hold" },
  Archived: { color: "#94A3B8", bg: "rgba(148,163,184,0.16)", label: "Archived" },
  Review: { color: "#3B82F6", bg: "rgba(59,130,246,0.14)", label: "In Review" },
};

export default function ProjectCard({
  project,
  onClick,
  onDelete,
  index = 0,
  showDelete = false,
}) {
  const status = STATUS_META[project.status] || STATUS_META.Active;
  const techs = Array.isArray(project.tech_stack) ? project.tech_stack : [];
  const hasRisk = project.latest_risk_score != null;
  const riskColor = hasRisk ? scoreColor(project.latest_risk_score) : "#64748B";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4 }}
      style={{ height: "100%" }}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={() => onClick?.(project.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(project.id);
          }
        }}
        sx={{
          width: "100%",
          height: "100%",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          background: "var(--cardBg)",
          border: "1px solid var(--borderColor)",
          boxShadow: "var(--shadowSoft)",
          overflow: "hidden",
          transition:
            "border-color 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            borderColor: `1px solid ${riskColor}66`,
            boxShadow: "var(--shadow)",
            "& .cs-project-card-arrow": { opacity: 1, transform: "translateX(0)" },
          },
          "&:focus-visible": { outline: "2px solid var(--primary)" },
        }}
      >
        {/* Top accent bar */}
        <Box
          sx={{
            height: 5,
            background: hasRisk
              ? `linear-gradient(90deg, ${riskColor}, ${riskColor}99)`
              : "linear-gradient(90deg, #2563EB, #7C3AED)",
          }}
        />

        <Box sx={{ p: 2.25, display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Header row */}
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `${riskColor}1f`,
                color: riskColor,
              }}
            >
              <FolderGit2 size={22} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--textPrimary)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {project.name}
                </Typography>
                <ArrowUpRight
                  size={16}
                  className="cs-project-card-arrow"
                  style={{
                    color: "var(--textMuted)",
                    opacity: 0,
                    transform: "translateX(-4px)",
                    transition: "all 250ms cubic-bezier(0.4,0,0.2,1)",
                    flexShrink: 0,
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    bgcolor: status.color,
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontSize: 12, color: "var(--textSecondary)" }}>
                  {status.label}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Description */}
          <Typography
            sx={{
              mt: 1.5,
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--textSecondary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 40,
            }}
          >
            {project.description || "No description yet — open the workspace to get started."}
          </Typography>

          {/* Tech stack */}
          {techs.length > 0 && (
            <Stack direction="row" spacing={0.6} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 0.6 }}>
              {techs.slice(0, 3).map((t) => (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--textSecondary)",
                    bgcolor: "var(--surfaceHover)",
                    border: "1px solid var(--borderColor)",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              ))}
              {techs.length > 3 && (
                <Chip
                  label={`+${techs.length - 3}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--textPrimary)",
                    bgcolor: "var(--surfaceHover)",
                  }}
                />
              )}
            </Stack>
          )}

          <Stack spacing={1} sx={{ mt: "auto", pt: 2 }}>
            {/* Risk score */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                bgcolor: `${riskColor}14`,
                border: `1px solid ${riskColor}44`,
              }}
            >
              <ShieldAlert size={16} style={{ color: riskColor, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: riskColor }}>
                  {hasRisk
                    ? `Risk Score · ${project.latest_risk_score}/100`
                    : "Risk Score · Not scanned yet"}
                </Typography>
                {project.latest_risk_level && (
                  <Typography sx={{ fontSize: 10.5, color: "var(--textMuted)" }}>
                    {project.latest_risk_level}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Footer meta */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.5}>
                <Tooltip title="Team members">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Users size={14} style={{ color: "var(--textMuted)" }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--textSecondary)" }}>
                      {project.member_count ?? 0}
                    </Typography>
                  </Box>
                </Tooltip>
                <Tooltip title="Security reports">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <FileText size={14} style={{ color: "var(--textMuted)" }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--textSecondary)" }}>
                      {project.report_count ?? 0}
                    </Typography>
                  </Box>
                </Tooltip>
                {project.repo_url && (
                  <Tooltip title="GitHub repository">
                    <GitBranch size={14} style={{ color: "var(--textMuted)" }} />
                  </Tooltip>
                )}
              </Stack>

              {showDelete && (
                <IconButton
                  size="small"
                  component="span"
                  aria-label="Delete project"
                  title="Delete project"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(project);
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    color: "var(--textMuted)",
                    "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.12)" },
                  }}
                >
                  <Trash2 size={15} />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>
    </motion.div>
  );
}