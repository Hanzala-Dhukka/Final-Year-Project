import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { severityColor, severityBg } from "./severity";

// Prioritized Recommendation Panel (Module 4.4 — Step 9).
export default function RecommendationPanel({ recommendations = [] }) {
  const groups = ["Critical", "High", "Medium", "Low"];
  const byPriority = groups.map((p) => ({
    priority: p,
    items: recommendations.filter((r) => r.priority === p),
  })).filter((g) => g.items.length);

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Recommendations" subheader="Grouped by priority" />
      <CardContent>
        {byPriority.length === 0 ? (
          <Typography color="text.secondary">No recommendations.</Typography>
        ) : (
          byPriority.map((g) => (
            <Box key={g.priority} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "inline-block",
                  px: 1.5,
                  py: 0.3,
                  borderRadius: 1,
                  fontWeight: 700,
                  fontSize: 13,
                  bgcolor: severityBg(g.priority),
                  color: severityColor(g.priority),
                }}
              >
                {g.priority}
              </Box>
              <List dense disablePadding sx={{ mt: 0.5 }}>
                {g.items.map((r, i) => (
                  <ListItem key={i} disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircle sx={{ color: severityColor(g.priority), fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={r.title}
                      secondary={r.description}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}
