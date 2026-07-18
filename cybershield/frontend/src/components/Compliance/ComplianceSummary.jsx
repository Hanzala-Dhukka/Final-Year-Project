import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";

// Executive summary: overall score + strongest / weakest framework.
export default function ComplianceSummary({ summary }) {
  if (!summary) return null;
  const overall = summary.overall_score ?? 0;
  const color = overall >= 80 ? "#059669" : overall >= 60 ? "#F59E0B" : "#DC2626";

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <InsightsIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Compliance Summary
          </Typography>
        </Stack>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="h2" fontWeight={900} sx={{ color }}>
            {overall}%
          </Typography>
          <Typography color="text.secondary">overall</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={`Strongest: ${summary.highest_framework || "n/a"}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Weakest: ${summary.highest_gap || "n/a"}`}
            color="error"
            variant="outlined"
          />
        </Stack>

        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {Object.entries(summary.frameworks || {}).map(([name, score]) => (
            <Chip key={name} label={`${name} ${score}%`} size="small" />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
