import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./Analytics.css";

const COLORS = [
  "#6366F1",
  "#06B6D4",
  "#22C55E",
  "#F97316",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#EAB308",
  "#14B8A6",
  "#F43F5E",
];

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#2b7489",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#239120",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#ffac45",
  Kotlin: "#F18E33",
  HTML: "#e34c26",
  CSS: "#1572B6",
  SCSS: "#CF649A",
  Vue: "#42b883",
  React: "#61dafb",
  Dockerfile: "#2496ed",
  Shell: "#89e051",
  PowerShell: "#012456",
  Makefile: "#427819",
  YAML: "#cb171e",
  JSON: "#292929",
  Markdown: "#083fa1",
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="recharts-tooltip-wrapper">
        <div className="recharts-tooltip-label">{label}</div>
        {payload.map((entry, index) => (
          <div
            key={index}
            className="recharts-tooltip-item"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value.toFixed(1)}%
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function LanguageChart({ languages }) {
  if (!languages || Object.keys(languages).length === 0) {
    return (
      <motion.div
        className="dashboardCard language-chart-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="dashboardCardTitle">Language Distribution</h3>
        <div className="chart-empty">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <p>No language data available</p>
        </div>
      </motion.div>
    );
  }

  const total = Object.values(languages).reduce((sum, val) => sum + val, 0);
  const data = Object.entries(languages)
    .map(([name, value]) => ({
      name,
      value: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
      color: LANGUAGE_COLORS[name] || COLORS[0],
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <motion.div
      className="dashboardCard language-chart-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="dashboardCardTitle">Language Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            outerRadius={100}
            innerRadius={50}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            labelLine={false}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default LanguageChart;