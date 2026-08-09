import { Card, CardContent, Typography, Box, LinearProgress, Stack } from "@mui/material";
import { frameworkMeta, scoreStatus } from "./frameworkMeta";

// Framework breakdown card: score, status chip, satisfied/total controls.
export default function FrameworkCard({ name, score, satisfied, total }) {
  const meta = frameworkMeta(name);
  const status = scoreStatus(score);
  const Icon = meta.icon;

  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: meta.color,
        },
      }}
    >
      <CardContent sx={{ position: "relative" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: meta.soft,
              color: meta.color,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ color: status.color, bgcolor: status.soft, px: 1.5, py: 0.4, borderRadius: 3 }}
          >
            {status.label}
          </Typography>
        </Stack>

        <Typography variant="h6" fontWeight={800} sx={{ mt: 1.5 }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {meta.desc}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography variant="h4" fontWeight={900} sx={{ color: meta.color }}>
            {score}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {satisfied}/{total} controls
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            mt: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(148,163,184,0.16)",
            "& .MuiLinearProgress-bar": { backgroundColor: meta.color, borderRadius: 4 },
          }}
        />
      </CardContent>
    </Card>
  );
}