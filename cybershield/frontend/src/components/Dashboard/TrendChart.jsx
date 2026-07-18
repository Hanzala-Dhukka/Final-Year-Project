import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@mui/material";

// Security score trend over time.
export default function TrendChart({ trends = [] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Security Score Trend" subheader="Global security score over time" />
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="security_score" name="Security" stroke="#2563EB" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
