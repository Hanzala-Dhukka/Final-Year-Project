import { Card, CardContent, Typography, Box, LinearProgress } from "@mui/material";

// Color per framework for consistent chart/card theming.
const FRAMEWORK_COLORS = {
  OWASP: "#2563EB",
  CWE: "#7C3AED",
  MITRE: "#DC2626",
  NIST: "#059669",
};

function scoreColor(score) {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#F59E0B";
  return "#DC2626";
}

// Single framework score card with a progress bar.
export default function FrameworkCard({ name, score }) {
  const color = FRAMEWORK_COLORS[name] || scoreColor(score);
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {name}
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color }}>
            {score}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: "#E5E7EB",
            "& .MuiLinearProgress-bar": { backgroundColor: color, borderRadius: 5 },
          }}
        />
      </CardContent>
    </Card>
  );
}
