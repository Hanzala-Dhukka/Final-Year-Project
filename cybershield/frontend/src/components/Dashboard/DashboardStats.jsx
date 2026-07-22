import CountUp from "react-countup";
import { FolderGit2, ScanLine, ShieldAlert, Zap } from "lucide-react";

export default function DashboardStats({
  projects = 6,
  scans = 41,
  threats = 7,
  xp = 1820
}) {
  const stats = [
    {
      title: "Projects",
      value: projects,
      icon: <FolderGit2 className="stat-icon-svg" />,
      color: "blue",
    },
    {
      title: "Scans",
      value: scans,
      icon: <ScanLine className="stat-icon-svg" />,
      color: "green",
    },
    {
      title: "Threats",
      value: threats,
      icon: <ShieldAlert className="stat-icon-svg" />,
      color: "orange",
    },
    {
      title: "Learning XP",
      value: xp,
      icon: <Zap className="stat-icon-svg" />,
      color: "purple",
    },
  ];

  return (
    <div className="dashboard-stats-grid">
      {stats.map((stat, idx) => (
        <div key={idx} className={`stat-card-modern ${stat.color}`}>
          <div className="stat-card-header">
            <span className="stat-title">{stat.title}</span>
            <div className="stat-icon-wrapper">{stat.icon}</div>
          </div>
          <h1 className="stat-value">
            <CountUp end={stat.value} duration={2} separator="," />
          </h1>
        </div>
      ))}
    </div>
  );
}
