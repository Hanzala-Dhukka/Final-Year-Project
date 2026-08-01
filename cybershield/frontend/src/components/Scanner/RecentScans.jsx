import { motion } from "framer-motion";
import { FiFileText, FiExternalLink } from "react-icons/fi";

const defaultScans = [
  { repo: "CyberShield", branch: "main", status: "Completed", score: 91, date: "2h ago" },
  { repo: "Demo API", branch: "develop", status: "Scanning", score: "--", date: "Now" },
  { repo: "SecureAuth", branch: "main", status: "Completed", score: 78, date: "1d ago" },
];

const statusColors = {
  Completed: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
  Scanning: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
  Failed: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
};

export default function RecentScans({ scans }) {
  const data = scans || defaultScans;

  return (
    <motion.div
      className="widget-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="widget-header">
        <FiFileText />
        <h2>Recent Scan History</h2>
        <button className="widget-link">View All <FiExternalLink /></button>
      </div>

      <div className="recent-scans-table-wrapper">
        <table className="recent-scans-table">
          <thead>
            <tr>
              <th>Repository</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((scan, i) => {
              const st = statusColors[scan.status] || statusColors.Completed;
              return (
                <tr key={i}>
                  <td className="scan-repo-name">{scan.repo}</td>
                  <td><code className="scan-branch-tag">{scan.branch}</code></td>
                  <td>
                    <span
                      className="scan-status-badge"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {scan.status}
                    </span>
                  </td>
                  <td className="scan-score">{scan.score}</td>
                  <td className="scan-date">{scan.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
