import { Box, Typography } from "@mui/material";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { scoreColor } from "../ThreatDashboard/severity";

// Shared animated risk-score gauge used across project pages.
export default function RiskGauge({ score, size = 168 }) {
  const hasScore = score != null;
  const color = hasScore ? scoreColor(score) : "#64748B";
  return (
    <Box sx={{ width: size, height: size, position: "relative" }}>
      <CircularProgressbar
        value={hasScore ? score : 0}
        maxValue={100}
        strokeWidth={9}
        styles={buildStyles({
          pathColor: color,
          trailColor: "var(--borderColor)",
          strokeLinecap: "round",
          transition: "stroke-dashoffset 0.8s ease",
        })}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
        }}
      >
        <Typography
          sx={{
            fontSize: size >= 150 ? 34 : 26,
            fontWeight: 900,
            color: hasScore ? color : "var(--textMuted)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {hasScore ? score : "—"}
        </Typography>
        <Typography sx={{ fontSize: size >= 150 ? 10.5 : 9, fontWeight: 700, color: "var(--textMuted)" }}>
          RISK SCORE
        </Typography>
      </Box>
    </Box>
  );
}
