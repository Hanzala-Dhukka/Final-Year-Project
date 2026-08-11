import { Box, Stack, Typography } from "@mui/material";

// Shared section card used across project pages.
export default function SectionCard({ icon, iconColor, title, action, children }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid var(--borderColor)",
        background: "var(--cardBg)",
        boxShadow: "var(--shadowSoft)",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.25, py: 1.75, borderBottom: "1px solid var(--borderColor)" }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${iconColor || "#2563EB"}1f`,
              color: iconColor || "#2563EB",
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--textPrimary)" }}>
            {title}
          </Typography>
        </Stack>
        {action}
      </Stack>
      <Box sx={{ p: 2.25 }}>{children}</Box>
    </Box>
  );
}
