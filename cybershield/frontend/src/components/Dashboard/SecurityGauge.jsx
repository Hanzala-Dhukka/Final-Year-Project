import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import { motion } from "framer-motion";
import { scoreColor } from "../ThreatDashboard/severity";

// Security score gauge (Module 3.2 — Step 5).
export default function SecurityGauge({ score, loading }) {
  const [animated, setAnimated] = useState(0);
  const value = score ?? 0;
  const color = scoreColor(value);

  useEffect(() => {
    let raf;
    const duration = 1000;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  if (loading) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Skeleton variant="circular" width={160} height={160} sx={{ mx: "auto" }} />
        </CardContent>
      </Card>
    );
  }

  const radius = 70;
  const stroke = 14;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - animated / 100);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Security Score
        </Typography>
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={stroke} />
            <motion.circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="h3" fontWeight={800} sx={{ color }}>
              {animated}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              / 100
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
