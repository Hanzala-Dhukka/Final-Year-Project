import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import { SEVERITY_COLORS } from "./severity";

// Risk Distribution Pie Chart (Module 4.4 — Step 5).
export default function RiskPieChart({ distribution = {} }) {
  const data = [
    { name: "Critical", value: distribution.critical || 0 },
    { name: "High", value: distribution.high || 0 },
    { name: "Medium", value: distribution.medium || 0 },
    { name: "Low", value: distribution.low || 0 },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Risk Distribution" subheader="Vulnerabilities by severity" />
      <CardContent>
        {total === 0 ? (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            No vulnerabilities recorded.
          </Typography>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  label={(d) => d.value}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={SEVERITY_COLORS[d.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <Typography variant="caption" color="text.secondary">
              Total findings: {total}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
