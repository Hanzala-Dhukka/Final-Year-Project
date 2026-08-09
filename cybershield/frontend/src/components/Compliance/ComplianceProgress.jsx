import { Card, CardContent, Typography, Box, Stack } from "@mui/material";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { scoreStatus } from "./frameworkMeta";

// Large hero ring showing the overall compliance score + status.
export default function ComplianceProgress({ score = 0, estimate = null }) {
  const status = scoreStatus(score);
  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        background: (t) =>
          `linear-gradient(135deg, ${t.palette.background.paper} 0%, ${status.soft} 130%)`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: status.soft,
          filter: "blur(60px)",
        }}
      />
      <CardContent sx={{ position: "relative", zIndex: 1 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          spacing={{ xs: 3, sm: 5 }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              Overall Compliance Score
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
              Security Posture
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 380 }}>
              Aggregated from OWASP, CWE, MITRE ATT&amp;CK and NIST CSF coverage of your
              scans, threat reports, checklists and lab practice.
            </Typography>
            {estimate != null && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1.5 }}>
                <ArrowUpwardIcon sx={{ fontSize: 18, color: "success.main" }} />
                <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                  Estimated {estimate}% after fixes
                </Typography>
              </Stack>
            )}
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ width: 160, height: 160 }}>
              <CircularProgressbar
                value={score}
                text={`${score}%`}
                strokeWidth={9}
                styles={buildStyles({
                  textColor: status.color,
                  pathColor: status.color,
                  trailColor: "rgba(148,163,184,0.18)",
                  textSize: "26px",
                  fontWeight: 800,
                })}
              />
            </Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{
                mt: 1.5,
                color: status.color,
                bgcolor: status.soft,
                display: "inline-block",
                borderRadius: 3,
                px: 2,
                py: 0.5,
              }}
            >
              {status.label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}