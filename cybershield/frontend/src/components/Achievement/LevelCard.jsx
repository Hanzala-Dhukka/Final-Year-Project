import { Card, CardContent, Typography, Box } from "@mui/material";
import { WorkspacePremium } from "@mui/icons-material";

// Level card (Module 3.3 — Step 16).
export default function LevelCard({ level, levelName, nextLevelName }) {
  const lvl = level ?? 1;
  const name = levelName || "Beginner";

  return (
    <Card>
      <CardContent sx={{ textAlign: "center" }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            mx: "auto",
            mb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
            color: "#fff",
          }}
        >
          <WorkspacePremium />
        </Box>
        <Typography variant="caption" color="text.secondary">
          LEVEL {lvl}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {name}
        </Typography>
        {nextLevelName && (
          <Typography variant="caption" color="text.secondary">
            Next: {nextLevelName}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
