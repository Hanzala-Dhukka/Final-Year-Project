// Shared severity / risk color helpers for the threat dashboard.

export const SEVERITY_COLORS = {
  Critical: "#e11d48", // red
  High: "#f97316",     // orange
  Medium: "#eab308",   // yellow
  Low: "#22c55e",      // green
};

export const SEVERITY_BG = {
  Critical: "rgba(225,29,72,0.12)",
  High: "rgba(249,115,22,0.12)",
  Medium: "rgba(234,179,8,0.14)",
  Low: "rgba(34,197,94,0.14)",
};

export function severityColor(level) {
  return SEVERITY_COLORS[level] || SEVERITY_COLORS.Low;
}

export function severityBg(level) {
  return SEVERITY_BG[level] || SEVERITY_BG.Low;
}

// Gauge color mapping: 0-20 green, 21-40 yellow, 41-70 orange, 71-100 red
export function scoreColor(score) {
  if (score >= 71) return "#e11d48";
  if (score >= 41) return "#f97316";
  if (score >= 21) return "#eab308";
  return "#22c55e";
}

export function riskLevelFromScore(score) {
  if (score >= 71) return "Critical";
  if (score >= 41) return "High";
  if (score >= 21) return "Medium";
  return "Low";
}
