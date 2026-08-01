import { motion } from "framer-motion";
import {
  FaRocket,
  FaTag,
  FaCalendarAlt,
  FaClock,
  FaGitAlt,
  FaCodeBranch,
  FaUserPlus,
  FaStar,
  FaCircle,
} from "react-icons/fa";
import "./Analytics.css";

const EVENT_TYPES = {
  created: { icon: FaRocket, color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", label: "Created" },
  first_commit: { icon: FaGitAlt, color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)", label: "First Commit" },
  first_release: { icon: FaTag, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", label: "First Release" },
  updated: { icon: FaCodeBranch, color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", label: "Last Updated" },
  pushed: { icon: FaGitAlt, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)", label: "Last Push" },
  stars: { icon: FaStar, color: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)", label: "Stars" },
  contributors: { icon: FaUserPlus, color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)", label: "Contributors" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ActivityTimeline({
  created_at,
  updated_at,
  pushed_at,
  first_commit_at,
  first_release_at,
  last_commit_at,
  stars,
  contributors,
}) {
  const events = [
    { type: "created", date: created_at, title: "Repository Created" },
    { type: "first_commit", date: first_commit_at, title: "First Commit" },
    { type: "first_release", date: first_release_at, title: "First Release" },
    { type: "updated", date: updated_at, title: "Last Updated" },
    { type: "pushed", date: pushed_at || last_commit_at, title: "Last Push" },
  ].filter((e) => e.date);

  const stats = [
    { type: "stars", value: stars, title: "Total Stars" },
    { type: "contributors", value: contributors, title: "Contributors" },
  ].filter((e) => e.value != null && e.value > 0);

  return (
    <motion.div
      className="dashboardCard activity-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="dashboardCardTitle">Repository Activity</h3>

      {events.length > 0 && (
        <div className="timeline" role="list" aria-label="Repository timeline">
          {events.map((event, index) => {
            const config = EVENT_TYPES[event.type];
            const isLast = index === events.length - 1;
            return (
              <motion.div
                key={event.type}
                className="timeline-item"
                role="listitem"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.08 }}
              >
                <div className="timeline-marker" style={{ backgroundColor: config.color }}>
                  <FaCircle size={10} style={{ color: "#fff" }} />
                </div>
                {!isLast && <div className="timeline-line" />}
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span
                      className="timeline-badge"
                      style={{ backgroundColor: config.bg, color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className="timeline-event-title">{event.title}</span>
                  </div>
                  <div className="timeline-meta">
                    <span className="timeline-date">{formatDate(event.date)}</span>
                    <span className="timeline-ago">{timeAgo(event.date)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {stats.length > 0 && (
        <div className="activity-stats" role="list" aria-label="Repository statistics">
          {stats.map((stat, index) => {
            const config = EVENT_TYPES[stat.type];
            return (
              <motion.div
                key={stat.type}
                className="activity-stat"
                role="listitem"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.08 }}
              >
                <div className="activity-stat-icon" style={{ backgroundColor: config.bg }}>
                  <config.icon size={20} style={{ color: config.color }} />
                </div>
                <div className="activity-stat-info">
                  <span className="activity-stat-value">{stat.value.toLocaleString()}</span>
                  <span className="activity-stat-label">{stat.title}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {events.length === 0 && stats.length === 0 && (
        <div className="chart-empty" role="status">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p>No activity data available</p>
        </div>
      )}
    </motion.div>
  );
}