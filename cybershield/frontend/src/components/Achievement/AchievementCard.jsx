import { Card, CardContent, Typography, Box, Stack, Chip } from "@mui/material";
import { EmojiEvents } from "@mui/icons-material";
import BadgeCard from "./BadgeCard";

// Achievement card wrapper (Module 3.3 — Step 16).
// Renders a single achievement using BadgeCard with an optional unlock date.
export default function AchievementCard({ achievement }) {
  return (
    <BadgeCard achievement={achievement} />
  );
}

// Helper to render a sectioned list (unlocked first).
export function AchievementList({ achievements }) {
  if (!achievements?.length) {
    return (
      <Typography color="text.secondary">No achievements yet.</Typography>
    );
  }
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
        gap: 2,
      }}
    >
      {achievements.map((a) => (
        <AchievementCard key={a.key || a.name} achievement={a} />
      ))}
    </Box>
  );
}
