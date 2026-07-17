import { Box, Typography, LinearProgress } from "@mui/material";
import { motion } from "framer-motion";

// XP progress bar (Module 3.3 — Step 16).
export default function XPBar({ xp = 0, nextLevelXp = 100, level = 1 }) {
  const pct = Math.min(100, Math.round((xp / Math.max(1, nextLevelXp)) * 100));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Level {level}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {xp} / {nextLevelXp} XP
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ height: 10, borderRadius: 5, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#22c55e,#0ea5e9)" } }}
      />
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {pct}% to next level
        </Typography>
      </Box>
    </Box>
  );
}
