import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp } from "lucide-react";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-blue-400">
        Score: <span className="text-white">{payload[0].value}</span>
      </p>
    </div>
  );
}

export default function SecurityTrend({ scoreHistory = [] }) {
  const chartData = useMemo(() => {
    return (scoreHistory || [])
      .map((item) => ({
        date: item.scan_date ?? item.date ?? item.created_at,
        score: item.score ?? item.security_score ?? 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [scoreHistory]);

  const formattedData = useMemo(() => {
    return chartData.map((d) => ({
      ...d,
      label: formatDate(d.date),
    }));
  }, [chartData]);

  const avgScore = useMemo(() => {
    if (formattedData.length === 0) return 0;
    return Math.round(formattedData.reduce((s, d) => s + d.score, 0) / formattedData.length);
  }, [formattedData]);

  const trend = useMemo(() => {
    if (formattedData.length < 2) return null;
    const last = formattedData[formattedData.length - 1].score;
    const prev = formattedData[formattedData.length - 2].score;
    const diff = last - prev;
    return { direction: diff >= 0 ? "up" : "down", value: Math.abs(diff) };
  }, [formattedData]);

  return (
    <motion.div
      className="rounded-2xl bg-gray-900 border border-gray-800 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Security Score Trend</h2>
        </div>
        {trend && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Avg:</span>
            <span className="text-white font-medium">{avgScore}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                trend.direction === "up"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {trend.direction === "up" ? "+" : "-"}{trend.value}
            </span>
          </div>
        )}
      </div>

      {formattedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <TrendingUp className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No score history available</p>
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#scoreGradient)"
                dot={
                  formattedData.length === 1
                    ? { r: 5, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 2 }
                    : { r: 3, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 1.5 }
                }
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
