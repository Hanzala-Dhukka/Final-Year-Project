import { Grid, Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import {
  Shield,
  BugReport,
  Description,
  Quiz,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { scoreColor } from "../ThreatDashboard/severity";

// Statistics cards (Module 3.2 — Step 6).
export default function StatsCards({ stats, loading }) {
  const s = stats || {};
  const cards = [
    {
      label: "Security Score",
      value: s.security_score ?? s.score ?? 0,
      icon: <Shield />,
      color: scoreColor(s.security_score ?? s.score ?? 0),
    },
    { label: "Repository Scans", value: s.repository_scans ?? s.total_scans ?? 0, icon: <BugReport />, color: "#0ea5e9" },
    { label: "Threat Reports", value: s.threat_reports ?? 0, icon: <Description />, color: "#6366f1" },
    { label: "Quiz Accuracy", value: `${s.quiz_accuracy ?? 0}%`, icon: <Quiz />, color: "#22c55e" },
  ];

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={6} md={3} key={i}>
            <Skeleton variant="rounded" height={110} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {cards.map((c, i) => (
        <Grid item xs={6} md={3} key={c.label}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: `${c.color}22`,
                    color: c.color,
                  }}
                >
                  {c.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {c.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {c.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
}
