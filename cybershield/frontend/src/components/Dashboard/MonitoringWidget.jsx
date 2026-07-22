import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Chip, List, ListItem, ListItemText, Divider, Button } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import automationApi from "../../api/automationApi";
import { useNavigate } from "react-router-dom";

function fmtNext(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.round((d - now) / 3600000);
  if (diffH <= 0) return "due now";
  if (diffH < 24) return `in ${diffH}h`;
  return `in ${Math.round(diffH / 24)}d (${d.toLocaleDateString()})`;
}

export default function MonitoringWidget() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [n, s] = await Promise.all([
          automationApi.getNotificationsSummary(),
          automationApi.listSchedules(),
        ]);
        if (!active) return;
        setNotifs(n.data.notifications || []);
        setUnread(n.data.count || 0);
        setSchedules(s || []);
      } catch (e) { /* ignore */ }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const upcoming = schedules
    .filter((s) => s.enabled)
    .sort((a, b) => new Date(a.next_run) - new Date(b.next_run))[0];

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <NotificationsActiveIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Notifications {unread > 0 && <Chip size="small" color="error" label={unread} />}
          </Typography>
        </Box>

        {notifs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No notifications.</Typography>
        ) : (
          <List dense disablePadding>
            {notifs.slice(0, 4).map((n) => (
              <ListItem key={n.id} disableGutters>
                <ListItemText
                  primary={n.title}
                  secondary={n.message}
                  primaryTypographyProps={{ fontWeight: 600, variant: "body2" }}
                />
                <Chip size="small" label={n.type} color={n.type === "critical" ? "error" : "default"} />
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <ScheduleIcon color="secondary" />
          <Typography variant="subtitle2" fontWeight={700}>Upcoming Scheduled Scan</Typography>
        </Box>
        {upcoming ? (
          <Typography variant="body2" color="text.secondary">
            {upcoming.frequency} · {fmtNext(upcoming.next_run)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">No active schedules.</Typography>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Button fullWidth variant="outlined" startIcon={<TrendingUpIcon />}
          onClick={() => navigate("/monitoring/schedules")}>
          Open Automation Center
        </Button>
      </CardContent>
    </Card>
  );
}
