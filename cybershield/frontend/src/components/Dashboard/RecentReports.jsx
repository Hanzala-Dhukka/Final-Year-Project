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

// Recent threat reports table (Module 3.2 — Step 9).
export default function RecentReports({ reports, loading }) {
  const list = reports || [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Recent Threat Reports
        </Typography>
        {loading ? (
          <Skeleton variant="rounded" height={140} />
        ) : list.length === 0 ? (
          <Typography color="text.secondary">No reports yet.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.slice(0, 5).map((r, i) => (
                  <TableRow key={r.id || i}>
                    <TableCell>{r.project}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.risk}
                        size="small"
                        sx={{ color: scoreColor(r.score ?? 60), fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>{r.score ?? "—"}</TableCell>
                    <TableCell>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
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
