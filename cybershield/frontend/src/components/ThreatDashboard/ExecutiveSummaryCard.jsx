import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  Typography,
  Stack,
} from "@mui/material";
import { severityColor, severityBg, scoreColor } from "./severity";

// Executive Summary Widget (Module 4.4 — Step 10).
export default function ExecutiveSummaryCard({ executive = {}, project = "", score = 0 }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Executive Summary" subheader={project} />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Overall Risk
            </Typography>
            <Box>
              <Chip
                label={executive.overall_risk || "Low"}
                sx={{
                  bgcolor: severityBg(executive.overall_risk || "Low"),
                  color: severityColor(executive.overall_risk || "Low"),
                  fontWeight: 700,
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Security Score
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: scoreColor(score) }}>
              {score}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Internet Facing
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {executive.internet_facing ? "Yes" : "No"}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Top Threat
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {executive.top_threat || "—"}
            </Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Sensitive Data
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap", gap: 1 }}>
          {(executive.sensitive_data || []).map((d) => (
            <Chip key={d} label={d} size="small" variant="outlined" />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
