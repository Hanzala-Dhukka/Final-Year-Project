import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ScanHistoryChart({ weeklyScans = [] }) {
  const defaultScans = [
    { day: "Mon", count: 5 },
    { day: "Tue", count: 8 },
    { day: "Wed", count: 6 },
    { day: "Thu", count: 12 },
    { day: "Fri", count: 9 },
    { day: "Sat", count: 4 },
    { day: "Sun", count: 7 },
  ];

  const chartData = weeklyScans.length > 0 ? weeklyScans : defaultScans;

  return (
    <div className="chart-widget scan-history-widget">
      <div className="widget-header">
        <h3>Weekly Scan History</h3>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="day" stroke="var(--text-secondary, #94a3b8)" />
            <YAxis stroke="var(--text-secondary, #94a3b8)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card-bg, #1e293b)",
                borderColor: "var(--border-color, #334155)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#6366f1">
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.count >= 10 ? "#3b82f6" : "#6366f1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
