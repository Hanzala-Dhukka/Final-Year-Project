import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { EmojiEvents } from "@mui/icons-material";
import { motion } from "framer-motion";

// Badge card — unlocked vs locked (Module 3.3 — Step 13).
export default function BadgeCard({ achievement }) {
  const { name, description, xp, icon: Icon, unlocked } = achievement;
  const IconCmp = Icon || EmojiEvents;

  return (
    <motion.div whileHover={{ y: -3 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card
        sx={{
          height: "100%",
          opacity: unlocked ? 1 : 0.55,
          filter: unlocked ? "none" : "grayscale(1)",
          border: unlocked ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(148,163,184,0.2)",
          background: unlocked ? "rgba(34,197,94,0.06)" : "transparent",
        }}
      >
        <CardContent sx={{ textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              mx: "auto",
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: unlocked ? "linear-gradient(135deg,#22c55e,#0ea5e9)" : "rgba(148,163,184,0.2)",
              color: "#fff",
            }}
          >
            <IconCmp />
          </Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={unlocked ? `+${xp} XP` : "Locked"}
              size="small"
              color={unlocked ? "success" : "default"}
              variant={unlocked ? "filled" : "outlined"}
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
