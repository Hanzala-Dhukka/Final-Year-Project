import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@mui/material";

// Risk trend: overall risk score over time (lower = better).
export default function RiskChart({ trends = [] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Risk Trend" subheader="Overall risk score (lower is better)" />
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Area type="monotone" dataKey="risk_score" name="Risk" stroke="#DC2626" fill="url(#riskGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
