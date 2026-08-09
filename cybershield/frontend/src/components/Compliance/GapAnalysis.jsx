import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Stack,
  LinearProgress,
  useTheme,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { frameworkMeta } from "./frameworkMeta";

// Expandable gap analysis: missing controls per framework.
export default function GapAnalysis({ gap = [], breakdown = {} }) {
  const theme = useTheme();

  const withSignals = gap.map((g) => {
    const key = g.framework.toLowerCase();
    const bd = breakdown?.[key] || {};
    return { ...g, satisfied: bd.satisfied, total: bd.total };
  });

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(245,158,11,0.14)",
            color: "warning.main",
          }}
        >
          <WarningAmberIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Gap Analysis
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Compliance controls not yet satisfied
          </Typography>
        </Box>
      </Stack>

      {withSignals.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 40, color: "success.main" }} />
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No gaps detected — all tracked controls satisfied.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {withSignals.map((g) => {
            const meta = frameworkMeta(g.framework);
            const missing = g.missing || [];
            const showProgress = g.total > 0;
            return (
              <Accordion
                key={g.framework}
                disableGutters
                sx={{
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  "&:before": { display: "none" },
                  boxShadow: "none",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: meta.soft,
                        color: meta.color,
                      }}
                    >
                      <meta.icon sx={{ fontSize: 16 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {g.framework}
                        </Typography>
                        <Typography variant="caption" sx={{ color: meta.color }} fontWeight={700}>
                          {g.score}%
                        </Typography>
                      </Box>
                      {showProgress && (
                        <LinearProgress
                          variant="determinate"
                          value={g.score}
                          sx={{
                            mt: 0.5,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: "rgba(148,163,184,0.16)",
                            "& .MuiLinearProgress-bar": { backgroundColor: meta.color },
                          }}
                        />
                      )}
                    </Box>
                    <Chip label={`${missing.length} missing`} size="small" color="error" variant="outlined" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {missing.length ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {missing.map((m) => (
                        <Chip key={m} label={m} size="small" variant="outlined" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="success.main">
                      Fully satisfied — no missing controls.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}