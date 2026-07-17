import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { scoreColor } from "./severity";

// Animated security-score gauge (Module 4.4 — Step 3).
export default function RiskGauge({ score = 0, level = "" }) {
  const [animated, setAnimated] = useState(0);
  const color = scoreColor(score);

  useEffect(() => {
    let raf;
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const radius = 80;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated / 100);

  return (
    <Box sx={{ textAlign: "center", position: "relative" }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.18)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h3" fontWeight={800} sx={{ color }}>
          {animated}
          <Typography component="span" variant="h6" sx={{ color: "text.secondary" }}>
            /100
          </Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Security Score
        </Typography>
        {level && (
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color, mt: 0.5 }}
          >
            {level}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
