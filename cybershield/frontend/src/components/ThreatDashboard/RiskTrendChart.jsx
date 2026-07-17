import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";

// Risk Trend / Security Improvement line chart (Module 4.4 — Step 11).
export default function RiskTrendChart({ timeline = [] }) {
  const data = timeline.map((p) => ({
    date: p.date,
    score: p.score,
  }));

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Risk Trend"
        subheader="Security score across previous reports"
      />
      <CardContent>
        {data.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            No historical reports yet.
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
