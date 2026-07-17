import { Card, CardContent, Typography, Chip, Stack, Box } from "@mui/material";
import { Folder } from "@mui/icons-material";
import { scoreColor } from "../ThreatDashboard/severity";

// Project summary card (Module 4.5 — Step 5).
export default function ProjectCard({ project, onClick }) {
  return (
    <Card
      sx={{ cursor: "pointer", height: "100%", "&:hover": { boxShadow: 6 } }}
      onClick={() => onClick?.(project.id)}
    >
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Folder color="primary" />
          <Typography variant="h6" fontWeight={700} noWrap>
            {project.name}
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {project.description || "No description"}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
          <Chip label={project.status} size="small" />
          <Chip label={`${project.member_count} members`} size="small" variant="outlined" />
          <Chip label={`${project.report_count} reports`} size="small" variant="outlined" />
        </Stack>
        {project.latest_risk_score != null && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Current Risk
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: scoreColor(project.latest_risk_score) }}>
              {project.latest_risk_score}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
