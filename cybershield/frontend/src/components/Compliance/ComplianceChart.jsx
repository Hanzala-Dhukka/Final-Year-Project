import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, Grid, Typography } from "@mui/material";

const FRAMEWORK_COLORS = {
  OWASP: "#2563EB",
  CWE: "#7C3AED",
  MITRE: "#DC2626",
  NIST: "#059669",
};

// Pie of the four framework scores.
function FrameworkPie({ frameworks }) {
  const data = Object.entries(frameworks || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Framework Distribution" subheader="Compliance score share" />
      <CardContent>
        {total === 0 ? (
          <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
            No compliance data yet.
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                label={(d) => `${d.name}: ${d.value}%`}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={FRAMEWORK_COLORS[d.name] || "#999"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Bar chart of compliance trend over time.
function ComplianceTrend({ history }) {
  const data = (history || []).map((h) => ({
    date: h.date,
    score: h.overall,
  }));
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Compliance Trend" subheader="Overall score over time" />
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Radar comparing the four frameworks.
function FrameworkRadar({ frameworks }) {
  const data = Object.entries(frameworks || {}).map(([framework, score]) => ({
    framework,
    score,
  }));
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="Framework Coverage" subheader="Relative strength per framework" />
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data} outerRadius={90}>
            <PolarGrid />
            <PolarAngleAxis dataKey="framework" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.5} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Composite chart block used by the dashboard.
export default function ComplianceChart({ frameworks, history }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <FrameworkPie frameworks={frameworks} />
      </Grid>
      <Grid item xs={12} md={4}>
        <ComplianceTrend history={history} />
      </Grid>
      <Grid item xs={12} md={4}>
        <FrameworkRadar frameworks={frameworks} />
      </Grid>
    </Grid>
  );
}
