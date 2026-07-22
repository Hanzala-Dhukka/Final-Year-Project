import { Box, Typography, Chip } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

const EVENT_ICONS = {
  github_scan: "🔍",
  scan_failed: "❌",
  checklist_updated: "✅",
  report_generated: "📄",
  schedule_created: "🗓️",
  compliance: "🛡️",
  dashboard_updated: "📊",
  automation_rule: "⚙️",
  full_scan_queued: "🔁",
};

function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Timeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No activity recorded yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {events.map((ev, idx) => (
        <Box key={ev.id || idx} display="flex" gap={1.5} mb={2}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <FiberManualRecordIcon color="primary" fontSize="small" />
            {idx < events.length - 1 && (
              <Box sx={{ width: 2, flexGrow: 1, bgcolor: "divider", mt: 0.5 }} />
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {EVENT_ICONS[ev.event] || "•"} {ev.title}
            </Typography>
            {ev.description && (
              <Typography variant="body2" color="text.secondary">
                {ev.description}
              </Typography>
            )}
            <Chip size="small" label={fmt(ev.created_at)} variant="outlined" sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
