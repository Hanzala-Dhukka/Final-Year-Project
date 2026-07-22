import { useState, useEffect } from "react";
import { Bell, RefreshCw, Shield, Award } from "lucide-react";

export default function DashboardHeader({
  username = "Hanzala",
  lastUpdated,
  lastScanTime = "10:32 AM",
  rank = "Silver",
  onRefresh,
  isRefreshing = false
}) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-header-widget">
      <div className="header-left">
        <h1>Welcome {username} 👋</h1>
        <p className="subheading">
          Real-Time CyberShield Operations Control Center
        </p>
      </div>

      <div className="header-right">
        <div className="meta-badge">
          <Shield size={16} />
          <span>Last Scan: {lastScanTime}</span>
        </div>

        <div className="meta-badge rank-badge">
          <Award size={16} />
          <span>Rank: {rank}</span>
        </div>

        <div className="meta-badge time-badge">
          <span>{lastUpdated || currentTime}</span>
        </div>

        <button
          className={`refresh-btn ${isRefreshing ? "spin" : ""}`}
          onClick={onRefresh}
          title="Refresh Dashboard Data"
        >
          <RefreshCw size={18} />
        </button>

        <div className="notification-bell-btn">
          <Bell size={20} />
          <span className="notification-dot" />
        </div>
      </div>
    </div>
  );
}
