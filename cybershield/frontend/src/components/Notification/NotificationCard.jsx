import { Card, CardContent, Typography, Box, IconButton, Chip, Button } from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";

import { useNavigate } from "react-router-dom";

const TYPE_META = {
  critical: { color: "error", icon: "🚨" },
  high: { color: "warning", icon: "⚠️" },
  medium: { color: "info", icon: "ℹ️" },
  low: { color: "default", icon: "🔽" },
  information: { color: "default", icon: "💡" },
  success: { color: "success", icon: "✅" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day(s) ago`;
}

export default function NotificationCard({ notification, onRead, onDelete }) {
  const navigate = useNavigate();
  const meta = TYPE_META[notification.type] || TYPE_META.information;

  const handleClick = () => {
    if (!notification.read) onRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <Card
      variant="outlined"
      onClick={handleClick}
      sx={{
        mb: 1,
        cursor: "pointer",
        borderLeft: `4px solid`,
        borderLeftColor: `${meta.color}.main`,
        opacity: notification.read ? 0.65 : 1,
        bgcolor: notification.read ? "background.paper" : "action.hover",
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {meta.icon} {notification.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notification.message}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              <Chip size="small" label={notification.type} color={meta.color} variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                {timeAgo(notification.created_at)}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {!notification.read && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}>
                <CheckCircleOutline fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
