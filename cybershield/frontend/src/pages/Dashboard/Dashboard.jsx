import { useEffect, useState } from "react";
import { Container, Grid, Box, Typography, Button, Alert, Skeleton } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboard } from "../../services/dashboardService";

import WelcomeCard from "../../components/Dashboard/WelcomeCard";
import StatsCards from "../../components/Dashboard/StatsCards";
import QuickActions from "../../components/Dashboard/QuickActions";
import SecurityGauge from "../../components/Dashboard/SecurityGauge";
import RecentScans from "../../components/Dashboard/RecentScans";
import RecentReports from "../../components/Dashboard/RecentReports";
import QuizProgress from "../../components/Dashboard/QuizProgress";
import LearningProgress from "../../components/Dashboard/LearningProgress";
import ActivityTimeline from "../../components/Dashboard/ActivityTimeline";
import DailyChallengeCard from "../../components/Dashboard/DailyChallengeCard";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError("");
    try {
      const { data: res } = await getDashboard(user._id);
      setData(res || {});
    } catch (e) {
      setError("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<Refresh />} onClick={load}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Welcome */}
      <Box sx={{ mb: 3 }}>
        <WelcomeCard user={data?.user} loading={loading} />
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 3 }}>
        <StatsCards stats={data?.stats} loading={loading} />
      </Box>

      {/* Quick Actions + Security Gauge */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <QuickActions loading={loading} />
        </Grid>
        <Grid item xs={12} md={5}>
          <SecurityGauge score={data?.stats?.security_score} loading={loading} />
        </Grid>
      </Grid>

      {/* Recent Scans */}
      <Box sx={{ mb: 3 }}>
        <RecentScans scans={data?.recent_scans} loading={loading} />
      </Box>

      {/* Recent Reports */}
      <Box sx={{ mb: 3 }}>
        <RecentReports reports={data?.recent_reports} loading={loading} />
      </Box>

      {/* Quiz + Learning Progress */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <QuizProgress progress={data?.quiz_progress} loading={loading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <LearningProgress progress={data?.learning_progress} loading={loading} />
        </Grid>
      </Grid>

      {/* Activity + Daily Challenge */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ActivityTimeline activity={data?.recent_activity} loading={loading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DailyChallengeCard challenge={data?.daily_challenge} loading={loading} />
        </Grid>
      </Grid>
    </Container>
  );
}
