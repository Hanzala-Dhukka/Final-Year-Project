import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Grid, Container, Typography, Box, Alert, Button, Skeleton } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { getProgress, getAchievements } from "../../services/achievementService";
import { buildAchievementList } from "../../components/Achievement/achievementCatalog";
import ProgressCard from "../../components/Achievement/ProgressCard";
import LevelCard from "../../components/Achievement/LevelCard";
import BadgeCard from "../../components/Achievement/BadgeCard";

export default function Achievements() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError("");
    try {
      const [p, a] = await Promise.all([
        getProgress(user._id),
        getAchievements(user._id),
      ]);
      setProgress(p.data?.data || p.data || {});
      const unlocked = a.data?.data?.badges || a.data?.badges || [];
      setAchievements(buildAchievementList(unlocked));
    } catch (e) {
      setError("Unable to load achievements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Achievements
          </Typography>
          <Typography color="text.secondary">
            Track your XP, level and cybersecurity badges
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          {loading ? <Skeleton variant="rounded" height={220} /> : <ProgressCard progress={progress} />}
        </Grid>
        <Grid item xs={12} md={4}>
          {loading ? (
            <Skeleton variant="rounded" height={220} />
          ) : (
            <LevelCard
              level={progress?.level}
              levelName={progress?.skill}
              nextLevelName="Next Rank"
            />
          )}
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        Unlocked Badges ({unlocked.length})
      </Typography>
      {loading ? (
        <Skeleton variant="rounded" height={160} />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(4,1fr)" },
            gap: 2,
            mb: 4,
          }}
        >
          {unlocked.length === 0 ? (
            <Typography color="text.secondary">No badges unlocked yet — complete actions to earn them!</Typography>
          ) : (
            unlocked.map((a) => <BadgeCard key={a.key} achievement={a} />)
          )}
        </Box>
      )}

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        Locked Badges ({locked.length})
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(4,1fr)" },
          gap: 2,
        }}
      >
        {locked.map((a) => (
          <BadgeCard key={a.key} achievement={a} />
        ))}
      </Box>
    </Container>
  );
}
