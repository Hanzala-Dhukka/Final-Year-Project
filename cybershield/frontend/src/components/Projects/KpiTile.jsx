import { Box, Typography } from "@mui/material";

// Shared KPI tile used across project pages.
export default function KpiTile({ icon, color, value, label, hint }) {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: "1px solid var(--borderColor)",
        background: "var(--cardBg)",
        boxShadow: "var(--shadowSoft)",
        px: 2,
        py: 1.75,
        display: "flex",
        alignItems: "center",
        gap: 1.75,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${color}1f`,
          color,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "var(--textPrimary)",
            letterSpacing: "-0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "var(--textSecondary)" }}>
          {label}
        </Typography>
        {hint && (
          <Typography sx={{ fontSize: 11, color: "var(--textMuted)", fontWeight: 500 }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
