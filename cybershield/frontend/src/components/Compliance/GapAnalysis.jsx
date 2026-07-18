import { Card, CardContent, CardHeader, Chip, Stack, Typography, Box } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// Lists the missing controls per framework (gap analysis).
export default function GapAnalysis({ gap = [] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Gap Analysis"
        subheader="Compliance controls not yet satisfied"
        avatar={<WarningAmberIcon color="warning" />}
      />
      <CardContent>
        {gap.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            No gaps detected — all tracked controls satisfied.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {gap.map((g) => (
              <Box key={g.framework}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {g.framework}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {g.score}%
                  </Typography>
                </Box>
                {g.missing && g.missing.length ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {g.missing.map((m) => (
                      <Chip key={m} label={m} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="success.main">
                    No missing controls
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
