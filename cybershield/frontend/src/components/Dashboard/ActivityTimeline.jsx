import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Stack,
} from "@mui/material";
import {
  Search,
  Quiz,
  Description,
  Person,
  Science,
  EmojiEvents,
} from "@mui/icons-material";

const ICONS = {
  scan: <Search fontSize="small" />,
  quiz: <Quiz fontSize="small" />,
  report: <Description fontSize="small" />,
  profile: <Person fontSize="small" />,
  challenge: <Science fontSize="small" />,
  achievement: <EmojiEvents fontSize="small" />,
};

// Recent activity timeline (Module 3.2 — Step 12).
export default function ActivityTimeline({ activity, loading }) {
  const list = activity || [];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rounded" height={160} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Recent Activity
        </Typography>
        {list.length === 0 ? (
          <Typography color="text.secondary">No recent activity.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {list.slice(0, 6).map((a, i) => {
              const key = (a.type || "").toLowerCase();
              const icon = ICONS[key] || ICONS.achievement;
              return (
                <Stack direction="row" spacing={1.5} key={a.id || i} alignItems="center">
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(99,102,241,0.12)",
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {a.activity || a.action || a.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.time
                        ? new Date(a.time).toLocaleString()
                        : a.created_at
                        ? new Date(a.created_at).toLocaleString()
                        : ""}
                      {a.xp ? ` · +${a.xp} XP` : ""}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
