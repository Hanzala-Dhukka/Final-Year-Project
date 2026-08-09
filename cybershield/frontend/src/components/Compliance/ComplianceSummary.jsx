import { Card, CardContent, Typography, Box, Stack, Chip, Divider } from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { frameworkMeta } from "./frameworkMeta";

// Executive summary: overall score + strongest / weakest framework.
export default function ComplianceSummary({ summary }) {
  if (!summary) return null;
  const overall = summary.overall_score ?? 0;
  const color = overall >= 80 ? "#059669" : overall >= 60 ? "#F59E0B" : "#DC2626";

  const strong = summary.highest_framework;
  const weak = summary.highest_gap;
  const StrongMeta = strong ? frameworkMeta(strong) : null;
  const WeakMeta = weak ? frameworkMeta(weak) : null;

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(37,99,235,0.12)",
              color: "primary.main",
            }}
          >
            <InsightsIcon fontSize="small" />
          </Box>
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

        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {StrongMeta && (
              <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: StrongMeta.soft, color: StrongMeta.color }}>
                <StrongMeta.icon sx={{ fontSize: 16 }} />
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
                <Typography variant="caption" color="text.secondary">
                  Strongest framework
                </Typography>
              </Stack>
              <Typography variant="subtitle2" fontWeight={700}>
                {strong || "n/a"}
              </Typography>
            </Box>
            {strong && <Chip label={`${summary.frameworks?.[strong] ?? 0}%`} color="success" size="small" variant="outlined" />}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {WeakMeta && (
              <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: WeakMeta.soft, color: WeakMeta.color }}>
                <WeakMeta.icon sx={{ fontSize: 16 }} />
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
                <Typography variant="caption" color="text.secondary">
                  Weakest framework
                </Typography>
              </Stack>
              <Typography variant="subtitle2" fontWeight={700}>
                {weak || "n/a"}
              </Typography>
            </Box>
            {weak && <Chip label={`${summary.frameworks?.[weak] ?? 0}%`} color="error" size="small" variant="outlined" />}
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
          Per-framework scores
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {Object.entries(summary.frameworks || {}).map(([name, score]) => (
            <Chip key={name} label={`${name} ${score}%`} size="small" variant="outlined" />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}