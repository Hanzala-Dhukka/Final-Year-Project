import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
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
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { frameworkMeta, FRAMEWORK_ORDER } from "./frameworkMeta";

function ChartCard({ title, subtitle, children }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

const TOOLTIP_STYLE = {
  background: "var(--cardBg)",
  border: "1px solid var(--borderColor)",
  borderRadius: 12,
  color: "var(--textPrimary)",
  fontSize: 13,
};

// Radar of the four framework scores.
function FrameworkRadar({ frameworks }) {
  const data = FRAMEWORK_ORDER.map((name) => ({ framework: name, score: frameworks[name] ?? 0 }));
  return (
    <ChartCard title="Framework Coverage" subtitle="Relative strength per standard">
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data} outerRadius={95}>
          <PolarGrid stroke="rgba(148,163,184,0.2)" />
          <PolarAngleAxis dataKey="framework" tick={{ fill: "var(--chartLabel)", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--chartLabel)", fontSize: 10 }} />
          <Radar dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.45} strokeWidth={2} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Line/area chart of the overall compliance trend over time.
function ComplianceTrend({ history }) {
  const data = (history || []).map((h) => ({
    date: h.date,
    overall: h.overall,
    ...(h.frameworks || {}),
  }));
  return (
    <ChartCard title="Compliance Trend" subtitle="Overall score over time">
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
          <XAxis dataKey="date" tick={{ fill: "var(--chartLabel)", fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--chartLabel)", fontSize: 11 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="overall"
            name="Overall"
            stroke="#2563EB"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Pie showing the share of each framework score.
function FrameworkPie({ frameworks }) {
  const data = FRAMEWORK_ORDER.map((name) => ({
    name,
    value: frameworks[name] ?? 0,
    color: frameworkMeta(name).color,
  })).filter((d) => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title="Distribution" subtitle="Score share per framework">
      {total === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
          No compliance data yet.
        </Typography>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: "var(--textSecondary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {data.map((d) => (
              <Box key={d.name} sx={{ textAlign: "center" }}>
                <Typography variant="h6" fontWeight={800} sx={{ color: d.color }}>
                  {d.value}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {d.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </ChartCard>
  );
}

// Composite chart row used by the dashboard.
export default function ComplianceChart({ frameworks, history }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
        gap: 3,
      }}
    >
      <FrameworkRadar frameworks={frameworks} />
      <ComplianceTrend history={history} />
      <FrameworkPie frameworks={frameworks} />
    </Box>
  );
}