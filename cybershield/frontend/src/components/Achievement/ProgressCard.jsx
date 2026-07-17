import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { Star, LocalFireDepartment, EmojiEvents } from "@mui/icons-material";
import XPBar from "./XPBar";

// Progress card (Module 3.3 — Step 14).
export default function ProgressCard({ progress }) {
  const p = progress || {};
  const xp = p.xp ?? 0;
  const nextLevelXp = p.next_level_xp ?? p.xp_to_next_level ?? 100;
  const level = p.level ?? 1;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Your Progress
        </Typography>
        <Box sx={{ mb: 2 }}>
          <XPBar xp={xp} nextLevelXp={nextLevelXp} level={level} />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={4} sx={{ textAlign: "center" }}>
            <Star sx={{ color: "#eab308" }} />
            <Typography variant="h6" fontWeight={800}>
              {xp}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total XP
            </Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: "center" }}>
            <EmojiEvents sx={{ color: "#6366f1" }} />
            <Typography variant="h6" fontWeight={800}>
              {p.skill || p.level_name || "Beginner"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rank
            </Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: "center" }}>
            <LocalFireDepartment sx={{ color: "#f97316" }} />
            <Typography variant="h6" fontWeight={800}>
              {p.current_streak ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Day Streak
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
