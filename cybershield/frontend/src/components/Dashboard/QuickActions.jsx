import { Grid, Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Security,
  Science,
  SmartToy,
  MenuBook,
  Quiz,
} from "@mui/icons-material";

// Quick action buttons (Module 3.2 — Step 7).
const ACTIONS = [
  { label: "Scan Repository", to: "/security-scanner", icon: <Search />, color: "#0ea5e9" },
  { label: "Threat Analysis", to: "/threat-analysis", icon: <Security />, color: "#6366f1" },
  { label: "OWASP Simulator", to: "/owasp-simulator", icon: <Science />, color: "#f97316" },
  { label: "Take Quiz", to: "/quiz", icon: <Quiz />, color: "#22c55e" },
  { label: "Glossary", to: "/glossary", icon: <MenuBook />, color: "#14b8a6" },
  { label: "AI Assistant", to: "/chatbot", icon: <SmartToy />, color: "#e11d48" },
];

export default function QuickActions({ loading }) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5}>
          {ACTIONS.map((a, i) => (
            <Grid item xs={6} key={a.label}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Box
                  onClick={() => navigate(a.to)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    p: 2,
                    borderRadius: 2,
                    cursor: "pointer",
                    border: "1px solid rgba(148,163,184,0.2)",
                    "&:hover": { borderColor: a.color, bgcolor: `${a.color}0f` },
                  }}
                >
                  <Box sx={{ color: a.color }}>{a.icon}</Box>
                  <Typography variant="caption" fontWeight={600} align="center">
                    {a.label}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
