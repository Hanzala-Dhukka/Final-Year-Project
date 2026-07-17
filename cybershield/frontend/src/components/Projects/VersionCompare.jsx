import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { scoreColor } from "../ThreatDashboard/severity";

// Version comparison (Module 4.5 — Step 7).
export default function VersionCompare({ versions = [], onCompare }) {
  const [a, setA] = useState(versions[0]?.version || "");
  const [b, setB] = useState(versions[1]?.version || "");
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!a || !b) return;
    const data = await onCompare?.(a, b);
    setResult(data);
  };

  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={5}>
          <TextField
            select
            fullWidth
            size="small"
            label="Version A"
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
          >
            {versions.map((v) => (
              <MenuItem key={v.id} value={v.version}>
                v{v.version}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={5}>
          <TextField
            select
            fullWidth
            size="small"
            label="Version B"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
          >
            {versions.map((v) => (
              <MenuItem key={v.id} value={v.version}>
                v{v.version}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={2}>
          <Button fullWidth variant="contained" onClick={run} disabled={!a || !b}>
            Compare
          </Button>
        </Grid>
      </Grid>

      {result && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Risk Score
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: scoreColor(result.risk_b) }}>
                  {result.risk_b}
                </Typography>
                <Chip
                  label={result.risk_diff > 0 ? `+${result.risk_diff}` : result.risk_diff}
                  size="small"
                  color={result.risk_diff > 0 ? "error" : "success"}
                />
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                New Threats
              </Typography>
              <Typography variant="h5" fontWeight={700} color="error">
                {result.new_threats}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Resolved
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {result.resolved_threats}
              </Typography>
            </Grid>
          </Grid>

          {result.details?.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell align="right">v{result.version_a}</TableCell>
                  <TableCell align="right">v{result.version_b}</TableCell>
                  <TableCell align="right">Δ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.details.map((d) => (
                  <TableRow key={d.severity}>
                    <TableCell>{d.severity}</TableCell>
                    <TableCell align="right">{d.from}</TableCell>
                    <TableCell align="right">{d.to}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: d.delta > 0 ? "error.main" : "success.main", fontWeight: 700 }}
                    >
                      {d.delta > 0 ? `+${d.delta}` : d.delta}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Box>
  );
}
