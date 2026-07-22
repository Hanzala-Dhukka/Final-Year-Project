import { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress, Stack, Divider } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import NotificationCard from "../../components/Notification/NotificationCard";
import automationApi from "../../api/automationApi";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await automationApi.getNotificationsSummary();
      setItems(data.notifications || []);
      setUnread(data.count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id) => {
    await automationApi.markNotificationRead(id);
    load();
  };
  const handleDelete = async (id) => {
    await automationApi.deleteNotification(id);
    load();
  };
  const handleReadAll = async () => {
    await automationApi.markAllRead();
    load();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={800}>
          Notifications {unread > 0 && <Typography component="span" color="error">({unread})</Typography>}
        </Typography>
        <Button startIcon={<DoneAllIcon />} onClick={handleReadAll} disabled={unread === 0}>
          Mark all read
        </Button>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">You have no notifications.</Typography>
      ) : (
        items.map((n) => (
          <NotificationCard key={n.id} notification={n} onRead={handleRead} onDelete={handleDelete} />
        ))
      )}
    </Box>
  );
}
