import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@mui/material";

// Compliance trend over time.
export default function ComplianceChart({ trends = [] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Compliance Trend" subheader="Overall compliance score over time" />
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="compliance_score" name="Compliance" stroke="#059669" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
