import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import { severityColor, severityBg } from "./severity";

// OWASP Top 10 Cards (Module 4.4 — Step 7).
export default function OWASPChart({ owasp = [] }) {
  const [open, setOpen] = useState(null);

  if (!owasp.length) {
    return (
      <Card>
        <CardHeader title="OWASP Top 10" />
        <CardContent>
          <Typography color="text.secondary">No OWASP data.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="OWASP Top 10" subheader="Mapped risk categories" />
      <CardContent>
        <Grid container spacing={1.5}>
          {owasp.map((c) => (
            <Grid item xs={6} sm={4} key={c.id}>
              <Box
                onClick={() => setOpen(open === c.id ? null : c.id)}
                sx={{
                  cursor: "pointer",
                  border: "1px solid rgba(148,163,184,0.25)",
                  borderRadius: 2,
                  p: 1.5,
                  height: "100%",
                  transition: "transform .15s",
                  "&:hover": { transform: "translateY(-2px)" },
                  borderLeft: `4px solid ${severityColor(c.severity)}`,
                }}
              >
                <Chip
                  label={c.id}
                  size="small"
                  sx={{
                    bgcolor: severityBg(c.severity),
                    color: severityColor(c.severity),
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                />
                <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                  {c.name}
                </Typography>
                {open === c.id && (
                  <Typography variant="caption" color="text.secondary">
                    {c.severity} — {c.description}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
