import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  TextField,
  Typography,
  Chip,
  Grid,
} from "@mui/material";
import { compareReports } from "../../api/threatDashboardApi";
import { severityColor } from "./severity";

// Threat Report Comparison (Module 4.4 — Step 12).
export default function ThreatComparison({ reports = [] }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (reports.length >= 2) {
      setA(reports[0].report_id);
      setB(reports[1].report_id);
    }
  }, [reports]);

  const run = async () => {
    if (!a || !b) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await compareReports(a, b);
      setResult(data);
    } catch (e) {
      setError("Could not compare reports.");
    } finally {
      setLoading(false);
    }
  };

  const diff = result ? result.risk_diff : 0;
  const diffColor = diff > 0 ? severityColor("Critical") : diff < 0 ? severityColor("Low") : "#94a3b8";
  const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Compare Reports" subheader="Risk & threat deltas" />
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Report A"
              value={a}
              onChange={(e) => setA(e.target.value)}
            >
              {reports.map((r) => (
                <MenuItem key={r.report_id} value={r.report_id}>
                  {r.project}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Report B"
              value={b}
              onChange={(e) => setB(e.target.value)}
            >
              {reports.map((r) => (
                <MenuItem key={r.report_id} value={r.report_id}>
                  {r.project}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={run}
              disabled={loading || !a || !b}
            >
              Compare
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        {result && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Risk Score
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                  {result.report_b.risk_score}
                </Typography>
                <Chip
                  label={diffLabel}
                  size="small"
                  sx={{ bgcolor: `${diffColor}22`, color: diffColor, fontWeight: 700 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                vs {result.report_a.risk_score}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                New Threats
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: severityColor("High") }}>
                {result.new_threats}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Resolved
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: severityColor("Low") }}>
                {result.resolved_threats}
              </Typography>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
