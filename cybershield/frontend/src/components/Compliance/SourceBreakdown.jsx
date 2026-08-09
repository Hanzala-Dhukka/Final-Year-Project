import { Card, CardContent, Typography, Box, Stack, LinearProgress } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import ArticleIcon from "@mui/icons-material/Article";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ScienceIcon from "@mui/icons-material/Science";

const SOURCE_META = [
  { key: "github_scan", label: "GitHub Scan", icon: GitHubIcon, color: "#2563EB" },
  { key: "threat_report", label: "Threat Report", icon: ArticleIcon, color: "#7C3AED" },
  { key: "checklist", label: "Security Checklist", icon: FactCheckIcon, color: "#059669" },
  { key: "owasp_simulator", label: "OWASP Simulator", icon: ScienceIcon, color: "#F59E0B" },
];

// Shows how many security signals fed into the compliance engine.
export default function SourceBreakdown({ sources = {} }) {
  const items = SOURCE_META.map((s) => ({
    ...s,
    count: sources[s.key] ?? 0,
  }));
  const total = items.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>
          Data Sources
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {total} security signals mapped onto frameworks
        </Typography>

        <Stack spacing={1.5}>
          {items.map((s) => {
            const Icon = s.icon;
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return (
              <Box key={s.key}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: `${s.color}1f`,
                        color: s.color,
                      }}
                    >
                      <Icon sx={{ fontSize: 15 }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {s.label}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={800} sx={{ color: s.color }}>
                    {s.count}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: "rgba(148,163,184,0.16)",
                    "& .MuiLinearProgress-bar": { backgroundColor: s.color },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}