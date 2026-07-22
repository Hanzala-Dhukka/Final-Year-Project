import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function ThreatDistribution({
  critical = 2,
  high = 5,
  medium = 9,
  low = 21
}) {
  const total = critical + high + medium + low || 1;

  const data = [
    { name: "Critical", value: critical, color: "#ef4444", pct: ((critical / total) * 100).toFixed(1) },
    { name: "High", value: high, color: "#f97316", pct: ((high / total) * 100).toFixed(1) },
    { name: "Medium", value: medium, color: "#eab308", pct: ((medium / total) * 100).toFixed(1) },
    { name: "Low", value: low, color: "#22c55e", pct: ((low / total) * 100).toFixed(1) },
  ];

  return (
    <div className="chart-widget threat-distribution-widget">
      <div className="pie-chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name, item) => [`${val} (${item.payload.pct}%)`, name]}
              contentStyle={{
                backgroundColor: "var(--card-bg, #1e293b)",
                borderColor: "var(--border-color, #334155)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="distribution-legend-grid">
        {data.map((item) => (
          <div key={item.name} className="legend-item">
            <span className="dot" style={{ backgroundColor: item.color }} />
            <span className="label">{item.name}:</span>
            <span className="val">{item.value} ({item.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
