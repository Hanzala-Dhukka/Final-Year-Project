import { Box, Typography, Avatar, Stack, useTheme } from "@mui/material";
import { motion } from "framer-motion";

// Personalized welcome card (Module 3.2 — Step 7).
export default function WelcomeCard({ user, loading }) {
  const theme = useTheme();
  const name = user?.full_name || "User";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: "#fff",
          borderRadius: 3,
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={user?.profile_image}
          sx={{ width: 64, height: 64, bgcolor: "rgba(255,255,255,0.25)", fontSize: 24 }}
        >
          {name[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Welcome back, {name} 👋
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Today is {today}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}
