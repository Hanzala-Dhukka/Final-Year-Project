import { Card, CardContent, Typography, Box, Skeleton, LinearProgress } from "@mui/material";

// Learning progress bars (Module 3.2 — Step 11).
const COLORS = ["#6366f1", "#0ea5e9", "#22c55e", "#f97316", "#e11d48"];

export default function LearningProgress({ progress, loading }) {
  const p = progress || {};

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rounded" height={120} />
        </CardContent>
      </Card>
    );
  }

  const bars = [
    { label: "Glossary", value: p.glossary ?? 0 },
    { label: "OWASP", value: p.owasp ?? 0 },
    { label: "Quiz", value: p.quiz ?? 0 },
    { label: "Labs", value: p.labs ?? 0 },
    { label: "Threat Modeling", value: p.threat_modeling ?? 0 },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Learning Progress
        </Typography>
        {bars.map((b, i) => (
          <Box key={b.label} sx={{ mb: 1.2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2">{b.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {b.value}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={b.value}
              sx={{
                height: 7,
                borderRadius: 4,
                "& .MuiLinearProgress-bar": { backgroundColor: COLORS[i % COLORS.length] },
              }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
