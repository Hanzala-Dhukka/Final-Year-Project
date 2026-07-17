import { Box, Typography, Stack } from "@mui/material";
import {
  Add,
  Description,
  Comment,
  History,
  TrendingDown,
  PersonAdd,
} from "@mui/icons-material";

const ICONS = {
  "Project Created": <Description color="primary" />,
  "Project Updated": <History color="info" />,
  "Threat Report Generated": <Description color="secondary" />,
  "Comment Added": <Comment color="success" />,
  "Member Joined": <PersonAdd color="warning" />,
  "Member Removed": <PersonAdd color="error" />,
  "Risk Reduced": <TrendingDown color="success" />,
};

// Activity timeline (Module 4.5 — Step 9).
export default function Timeline({ activities = [] }) {
  if (!activities.length) {
    return <Typography color="text.secondary">No activity yet.</Typography>;
  }
  return (
    <Box sx={{ position: "relative", pl: 1 }}>
      {activities.map((a, i) => (
        <Stack direction="row" spacing={2} key={a.id || i} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(99,102,241,0.12)",
              flexShrink: 0,
            }}
          >
            {ICONS[a.action] || <Add fontSize="small" />}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {a.action}
            </Typography>
            {a.detail && (
              <Typography variant="caption" color="text.secondary">
                {a.detail}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" display="block">
              {a.user_name} · {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Box>
  );
}
