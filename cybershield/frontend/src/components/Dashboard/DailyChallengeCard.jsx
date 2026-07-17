import { Card, CardContent, Typography, Button, Chip, Box, Skeleton } from "@mui/material";
import { Bolt, Star } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// Daily challenge card (Module 3.2 — Step 13).
export default function DailyChallengeCard({ challenge, loading }) {
  const navigate = useNavigate();
  const c = challenge || {};

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
          Daily Challenge
        </Typography>
        {!c.title ? (
          <Typography color="text.secondary">No challenge today. Check back tomorrow!</Typography>
        ) : (
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {c.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, my: 1 }}>
              <Chip label={`Difficulty: ${c.difficulty || "Medium"}`} size="small" />
              <Chip
                icon={<Star />}
                label={`${c.reward || 50} XP`}
                size="small"
                color="warning"
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<Bolt />}
              onClick={() => navigate("/challenges")}
              sx={{ mt: 1 }}
            >
              Start
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
