import { Card, CardContent, Typography, Box, LinearProgress } from "@mui/material";

// Large overall progress bar shown at the top of the dashboard.
export default function ComplianceProgress({ score = 0 }) {
  const color = score >= 80 ? "#059669" : score >= 60 ? "#F59E0B" : "#DC2626";
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          Overall Compliance Score
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mt: 1 }}>
          <Typography variant="h2" fontWeight={900} sx={{ color }}>
            {score}%
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress
              variant="determinate"
              value={score}
              sx={{
                height: 16,
                borderRadius: 8,
                backgroundColor: "#E5E7EB",
                "& .MuiLinearProgress-bar": { backgroundColor: color, borderRadius: 8 },
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
