import { RadialBarChart, RadialBar } from "recharts";

export default function ProgressChart({ data = {} }) {
  const chartData = [
    { name: "Glossary", progress: data?.glossary || 45, fill: "#0ea5e9" },
    { name: "OWASP", progress: data?.owasp || 70, fill: "#6366f1" },
    { name: "Quiz", progress: data?.quiz || 85, fill: "#22c55e" },
  ];

  return (
    <div className="chart-container progress-chart">
      <h2>Learning Progress</h2>
      <div className="radial-charts">
        {chartData.map((item) => (
          <div key={item.name} className="radial-item">
            <RadialBarChart width={120} height={120} innerRadius="60%" outerRadius="90%" data={[item]} startAngle={90} endAngle={-270}>
              <RadialBar
                minAngle={15}
                background
                clockWise
                dataKey="progress"
                fill={item.fill}
                cornerRadius={10}
              />
            </RadialBarChart>
            <div className="radial-label">
              <span className="radial-name">{item.name}</span>
              <span className="radial-value">{item.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}