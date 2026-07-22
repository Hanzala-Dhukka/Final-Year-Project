import { Card, CardContent, Typography, Box, Chip, Switch, FormControlLabel, IconButton, Stack, MenuItem, TextField } from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import PlayArrow from "@mui/icons-material/PlayArrow";

function fmtNext(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function ScheduleCard({ schedule, projectName, onToggle, onDelete, onRun, onUpdate }) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {projectName || schedule.project_id || "Project"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {schedule.repo_url || "No repository linked"}
            </Typography>
          </Box>
          <Box>
            <IconButton color="primary" onClick={() => onRun(schedule)} title="Run now">
              <PlayArrow />
            </IconButton>
            <IconButton color="error" onClick={() => onDelete(schedule.id)}>
              <DeleteOutline />
            </IconButton>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" mt={1} flexWrap="wrap">
          <Chip size="small" label={schedule.frequency} color="primary" />
          <Chip size="small" label={`Next: ${fmtNext(schedule.next_run)}`} variant="outlined" />
          {schedule.last_run && (
            <Chip size="small" label={`Last: ${fmtNext(schedule.last_run)}`} variant="outlined" />
          )}

          <TextField
            select
            size="small"
            label="Frequency"
            value={schedule.frequency}
            onChange={(e) => onUpdate(schedule.id, { frequency: e.target.value })}
            sx={{ minWidth: 120, ml: "auto" }}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={schedule.enabled}
              onChange={(e) => onToggle(schedule.id, e.target.checked)}
            />
          }
          label={schedule.enabled ? "Enabled" : "Disabled"}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );
}
