import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
  Divider,
  Stack,
} from "@mui/material";
import { severityColor, severityBg } from "./severity";

// MITRE ATT&CK Visualization (Module 4.4 — Step 8).
// Renders technique cards; clicking opens a detail panel.
export default function MITRETimeline({ mitre = [] }) {
  const [active, setActive] = useState(null);

  if (!mitre.length) {
    return (
      <Card>
        <CardHeader title="MITRE ATT&CK" />
        <CardContent>
          <Typography color="text.secondary">No MITRE data.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="MITRE ATT&CK" subheader="Techniques mapped to your stack" />
      <CardContent>
        <Grid container spacing={1.5}>
          {mitre.map((t) => (
            <Grid item xs={12} sm={6} key={t.technique}>
              <Box
                onClick={() => setActive(active?.technique === t.technique ? null : t)}
                sx={{
                  cursor: "pointer",
                  border: "1px solid rgba(148,163,184,0.25)",
                  borderRadius: 2,
                  p: 1.5,
                  borderLeft: `4px solid ${severityColor(t.severity)}`,
                  "&:hover": { bgcolor: "rgba(148,163,184,0.06)" },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t.technique}
                  </Typography>
                  <Chip
                    label={t.severity}
                    size="small"
                    sx={{
                      bgcolor: severityBg(t.severity),
                      color: severityColor(t.severity),
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                <Typography variant="body2">{t.name}</Typography>
                {active?.technique === t.technique && (
                  <Box sx={{ mt: 1 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Affected: {(t.affected_assets || []).join(", ")}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Recommendations
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(t.recommendations || []).map((r, i) => (
                        <li key={i}>
                          <Typography variant="body2">{r}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
