import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import ChartTip from "./ChartTip";

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
            <PolarGrid stroke="var(--chartGrid)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--chartLabel)", fontSize: 12 }}
            />
            <Tooltip content={<ChartTip />} />
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
