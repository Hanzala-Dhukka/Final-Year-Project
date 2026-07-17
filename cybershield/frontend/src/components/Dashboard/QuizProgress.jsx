import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Skeleton,
  LinearProgress,
} from "@mui/material";
import { EmojiEvents } from "@mui/icons-material";

// Quiz progress (Module 3.2 — Step 10).
export default function QuizProgress({ progress, loading }) {
  const p = progress || {};

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rounded" height={120} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Quiz Progress
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {p.completed_quizzes ?? 0}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Average
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {p.average_score ?? 0}%
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Highest
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {p.highest_score ?? 0}%
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, p.average_score ?? 0)}
            color="success"
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Box sx={{ mt: 1.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {(p.badges || []).slice(0, 4).map((b, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.3,
                borderRadius: 1,
                bgcolor: "rgba(234,179,8,0.15)",
                fontSize: 12,
              }}
            >
              <EmojiEvents fontSize="small" sx={{ color: "#eab308" }} />
              {b}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
