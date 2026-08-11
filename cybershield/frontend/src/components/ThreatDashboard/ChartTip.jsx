import { Box, Typography } from "@mui/material";

// Theme-aware custom tooltip used by the threat dashboard charts.
export default function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: "var(--cardBg)",
        border: "1px solid var(--borderColor)",
        borderRadius: 2,
        px: 1.5,
        py: 1,
        boxShadow: "var(--shadow)",
      }}
    >
      {label != null && (
        <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)", mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.map((p) => (
        <Typography key={p.dataKey || p.name} sx={{ fontSize: 12, color: "var(--textPrimary)" }}>
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 2,
              bgcolor: p.color || p.fill,
              mr: 1,
            }}
          />
          {p.name}: <b>{Number.isFinite(p.value) ? p.value.toLocaleString() : p.value}</b>
        </Typography>
      ))}
    </Box>
  );
}