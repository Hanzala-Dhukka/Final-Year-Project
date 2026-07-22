import { Card, CardContent, Typography, Box, Chip, IconButton, Stack, Switch, FormControlLabel } from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";

const CONDITION_LABELS = {
  critical_count: "Critical Vulnerabilities",
  risk_score: "Risk Score",
  compliance: "Compliance Score",
};
const OPERATOR_LABELS = { gt: ">", gte: "≥", lt: "<", lte: "≤" };

export default function AutomationRule({ rule, onToggle, onDelete }) {
  return (
    <Card variant="outlined" sx={{ mb: 1.5, borderLeft: "4px solid", borderLeftColor: "secondary.main" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight={700}>
            {rule.name}
          </Typography>
          <IconButton color="error" onClick={() => onDelete(rule.id)}>
            <DeleteOutline />
          </IconButton>
        </Box>

        <Box mt={1}>
          <Chip
            size="small"
            color="error"
            label={
              `IF ${CONDITION_LABELS[rule.condition_type] || rule.condition_type} ` +
              `${OPERATOR_LABELS[rule.operator] || rule.operator} ${rule.threshold}`
            }
          />
          <Box component="span" mx={1} fontWeight={700}>→</Box>
          {rule.actions.map((a) => (
            <Chip key={a} size="small" sx={{ mr: 0.5 }} label={a} color="primary" variant="outlined" />
          ))}
        </Box>

        <FormControlLabel
          control={
            <Switch checked={rule.enabled} onChange={(e) => onToggle(rule.id, e.target.checked)} />
          }
          label={rule.enabled ? "Enabled" : "Disabled"}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );
}
