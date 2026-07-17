import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Box,
} from "@mui/material";
import { scoreColor } from "../ThreatDashboard/severity";

// Recent security scans table (Module 3.2 — Step 8).
export default function RecentScans({ scans, loading }) {
  const list = scans || [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Recent Security Scans
        </Typography>
        {loading ? (
          <Skeleton variant="rounded" height={140} />
        ) : list.length === 0 ? (
          <Typography color="text.secondary">No scans yet.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Repository</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Files</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.slice(0, 5).map((s, i) => (
                  <TableRow key={s.id || i}>
                    <TableCell>{s.repository}</TableCell>
                    <TableCell>
                      <Chip
                        label={s.risk_level}
                        size="small"
                        sx={{ color: scoreColor(s.severity_score ?? s.risk_score ?? 60), fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>{s.files ?? "—"}</TableCell>
                    <TableCell>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip label={s.status || "Completed"} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
