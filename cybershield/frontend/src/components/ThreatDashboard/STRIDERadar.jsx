import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";

// STRIDE Radar Chart (Module 4.4 — Step 4).
export default function STRIDERadar({ stride = {} }) {
  const data = [
    { axis: "Spoofing", value: stride.Spoofing || 0 },
    { axis: "Tampering", value: stride.Tampering || 0 },
    { axis: "Repudiation", value: stride.Repudiation || 0 },
    { axis: "Info Disclosure", value: stride.InformationDisclosure || 0 },
    { axis: "DoS", value: stride.DoS || 0 },
    { axis: "Elevation", value: stride.Elevation || 0 },
  ];

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="STRIDE Radar" subheader="Threat exposure by category" />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="rgba(148,163,184,0.3)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
            <Radar
              name="Risk"
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.45}
            />
          </RadarChart>
        </ResponsiveContainer>
        <Typography variant="caption" color="text.secondary">
          Scale: 0 (Low) → 100 (Critical)
        </Typography>
      </CardContent>
    </Card>
  );
}
