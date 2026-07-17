import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
} from "@mui/material";

// Audit log table (Module 4.5 — Step 10).
export default function AuditLogTable({ logs = [] }) {
  if (!logs.length) {
    return <Typography color="text.secondary">No audit entries.</Typography>;
  }
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.user_name}</TableCell>
              <TableCell>
                <Chip label={l.action} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {l.target || "—"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {l.created_at ? new Date(l.created_at).toLocaleString() : ""}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
