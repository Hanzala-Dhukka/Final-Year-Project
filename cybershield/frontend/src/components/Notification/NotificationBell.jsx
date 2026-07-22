import { useState, useEffect } from "react";
import { IconButton, Badge, Menu, Box, Typography, Button, Divider } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import NotificationCard from "./NotificationCard";
import automationApi from "../../api/automationApi";

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      const { data } = await automationApi.getNotificationsSummary();
      setItems(data.notifications || []);
      setUnread(data.count || 0);
    } catch (e) {
      // ignore — keep the bell functional even if the call fails
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(t);
  }, []);

  const open = (e) => setAnchorEl(e.currentTarget);
  const close = () => setAnchorEl(null);

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
    <>
      <IconButton onClick={open} color="inherit">
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={close}
        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
      >
        <Box px={2} py={1} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight={700}>
            Notifications {unread > 0 && `(${unread})`}
          </Typography>
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={handleReadAll}
            disabled={unread === 0}
          >
            Mark all read
          </Button>
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 380, overflowY: "auto", p: 1 }}>
          {items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No notifications yet.
            </Typography>
          ) : (
            items.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </Box>
      </Menu>
    </>
  );
}
