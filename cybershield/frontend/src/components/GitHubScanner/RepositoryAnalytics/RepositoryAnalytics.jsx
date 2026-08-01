import { motion } from "framer-motion";
import {
  FaStar, FaCodeBranch, FaBug, FaGlobe, FaFileAlt, FaCode,
  FaServer, FaDatabase, FaNetworkWired, FaBox, FaShieldAlt,
  FaExclamationTriangle, FaCheckCircle, FaHashtag, FaLock,
} from "react-icons/fa";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import "./Analytics.css";

const COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  safe: "#22c55e",
  outdated: "#f59e0b",
  risky: "#ef4444",
};

const PIE_COLORS = ["#6366f1", "#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

export default function RepositoryAnalytics({
  repository = {},
  technologies = {},
  dependencyReport = {},
  scanSummary = {},
  findings = [],
  dependencyFindings = [],
}) {
  /* ── Data derivation ──────────────────────────────────────── */
  const repo = repository;
  const tech = technologies || {};
  const dep = dependencyReport || {};
  const summary = scanSummary || {};

  // Language chart data
  const languageData = (tech.languages || []).map((lang) => ({
    name: lang,
    value: 100,
  }));

  // Dependency health chart
  const safePkgs = (dep.totalPackages || 0) - (dep.outdated || 0) - (dep.risky || 0);
  const dependencyData = [
    { name: "Safe", value: Math.max(0, safePkgs) },
    { name: "Outdated", value: dep.outdated || 0 },
    { name: "Risky", value: dep.risky || 0 },
  ];

  // Severity distribution
  const severity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  (findings || []).forEach((item) => {
    if (severity[item.severity] !== undefined) severity[item.severity]++;
  });
  const severityData = [
    { name: "Critical", value: severity.Critical },
    { name: "High", value: severity.High },
    { name: "Medium", value: severity.Medium },
    { name: "Low", value: severity.Low },
  ];

  // Technology stack (combined)
  const techStack = [
    ...tech.languages?.map((t) => ({ name: t, category: "Languages", color: "#f59e0b" })) || [],
    ...tech.backend?.map((t) => ({ name: t, category: "Backend", color: "#3b82f6" })) || [],
    ...tech.database?.map((t) => ({ name: t, category: "Database", color: "#10b981" })) || [],
    ...tech.devops?.map((t) => ({ name: t, category: "DevOps", color: "#8b5cf6" })) || [],
  ];

  // Repository stats
  const repoStats = [
    { title: "Stars", value: (repo.stars || 0).toLocaleString(), icon: <FaStar />, color: "#f59e0b" },
    { title: "Forks", value: (repo.forks || 0).toLocaleString(), icon: <FaCodeBranch />, color: "#3b82f6" },
    { title: "Issues", value: (repo.issues || 0).toLocaleString(), icon: <FaBug />, color: "#ef4444" },
    { title: "Language", value: repo.language || "—", icon: <FaCode />, color: "#f97316" },
    { title: "Visibility", value: repo.visibility ? repo.visibility.charAt(0).toUpperCase() + repo.visibility.slice(1) : "—", icon: <FaGlobe />, color: "#8b5cf6" },
    { title: "License", value: repo.license || "—", icon: <FaFileAlt />, color: "#10b981" },
  ];

  // Security summary
  const securityData = [
    { title: "Files with Issues", value: summary.filesWithIssues ?? "—", icon: <FaFileAlt />, color: "#f97316" },
    { title: "Risk Level", value: summary.riskLevel || "—", icon: <FaShieldAlt />, color: summary.riskLevel === "High" ? "#ef4444" : "#f59e0b" },
    { title: "Total Findings", value: (findings || []).length || 0, icon: <FaExclamationTriangle />, color: "#ef4444" },
    { title: "Dependencies", value: dep.totalPackages ?? "—", icon: <FaBox />, color: "#06b6d4" },
  ];

  return (
    <motion.div
      className="analytics-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="analytics-header">
        <h2 className="analytics-title">Repository Analytics</h2>
      </div>

      {/* ── Repository Score Cards ──────────────────────────── */}
      <div className="analytics-grid">
        <div className="dashboardCard language-chart-card">
          <h3 className="dashboardCardTitle"><FaStar /> Repository Score</h3>
          <div className="stats-grid">
            {repoStats.map((stat) => (
              <div key={stat.title} className="stat-card">
                <div className="stat-icon" style={{ background: stat.color + "22", color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Language Distribution ─────────────────────────── */}
        <div className="dashboardCard statistics-card">
          <h3 className="dashboardCardTitle"><FaCode /> Language Distribution</h3>
          {languageData.length > 0 ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {languageData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty"><p>No language data</p></div>
          )}
        </div>
      </div>

      {/* ── Security + Dependency Charts ────────────────────── */}
      <div className="analytics-grid">
        {/* Security Risk Distribution */}
        <div className="dashboardCard">
          <h3 className="dashboardCardTitle"><FaShieldAlt /> Security Risk Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dependency Health */}
        <div className="dashboardCard">
          <h3 className="dashboardCardTitle"><FaBox /> Dependency Health</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dependencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {dependencyData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Technology Stack ────────────────────────────────── */}
      {techStack.length > 0 && (
        <div className="dashboardCard">
          <h3 className="dashboardCardTitle"><FaServer /> Technology Stack</h3>
          <div className="tech-chips">
            {techStack.map((item) => (
              <span
                key={item.name}
                className="tech-chip"
                style={{
                  borderColor: item.color + "44",
                  background: item.color + "15",
                  color: item.color,
                }}
              >
                {item.category}: {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Security Summary ────────────────────────────────── */}
      <div className="dashboardCard">
        <h3 className="dashboardCardTitle"><FaExclamationTriangle /> Security Summary</h3>
        <div className="stats-grid">
          {securityData.map((stat) => (
            <div key={stat.title} className="stat-card">
              <div className="stat-icon" style={{ background: stat.color + "22", color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                <span className="stat-label">{stat.title}</span>
              </div>
            </div>
          ))}
        </div>
        {summary.recommendation && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(99,102,241,0.1)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.2)" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1" }}>{summary.recommendation}</p>
          </div>
        )}
      </div>

      {/* ── Dependency Findings Table ───────────────────────── */}
      {dependencyFindings.length > 0 && (
        <div className="dashboardCard">
          <h3 className="dashboardCardTitle"><FaBox /> Dependency Findings ({dependencyFindings.length})</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#94a3b8", fontWeight: 600 }}>Package</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#94a3b8", fontWeight: 600 }}>Version</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#94a3b8", fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#94a3b8", fontWeight: 600 }}>Severity</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#94a3b8", fontWeight: 600 }}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {dependencyFindings.map((pkg, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "10px 12px", color: "#e2e8f0", fontWeight: 600 }}>{pkg.package}</td>
                    <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{pkg.version}</td>
                    <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{pkg.status}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: (COLORS[pkg.severity?.toLowerCase()] || "#64748b") + "22",
                        color: COLORS[pkg.severity?.toLowerCase()] || "#64748b",
                      }}>
                        {pkg.severity}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{pkg.recommendation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}