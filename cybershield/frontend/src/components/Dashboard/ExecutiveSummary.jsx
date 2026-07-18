import {
  Card, CardContent, CardHeader, Typography, Box, List, ListItem,
  ListItemIcon, ListItemText, Divider, Chip,
} from "@mui/material";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

// AI-generated executive summary block.
export default function ExecutiveSummary({ summary = {} }) {
  const actions = summary.priority_actions || [];
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="AI Executive Summary"
        subheader="Generated narrative for leadership"
        avatar={<LightbulbIcon color="warning" />}
      />
      <CardContent>
        {summary.executive_summary && (
          <Typography variant="body1" gutterBottom>
            {summary.executive_summary}
          </Typography>
        )}
        {summary.business_risk && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <b>Business risk:</b> {summary.business_risk}
          </Typography>
        )}
        {summary.security_outlook && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <b>Outlook:</b> {summary.security_outlook}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <TrendingUpIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700}>
            Priority Actions
          </Typography>
        </Box>
        <List dense>
          {actions.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No actions recommended.
            </Typography>
          )}
          {actions.map((a, i) => (
            <ListItem key={i} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={a} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
