import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function SecurityScore({ score = 82 }) {
  const getScoreRating = (s) => {
    if (s > 90) return { label: "Excellent", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" };
    if (s > 75) return { label: "Good", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" };
    if (s > 50) return { label: "Needs Improvement", color: "#eab308", bg: "rgba(234, 179, 8, 0.15)" };
    return { label: "Critical", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
  };

  const rating = getScoreRating(score);

  return (
    <div className="security-score-widget">
      <div className="score-badge-row">
        <span className="score-rating-badge" style={{ color: rating.color, backgroundColor: rating.bg }}>
          {rating.label}
        </span>
      </div>
      <div className="score-gauge-container">
        <CircularProgressbar
          value={score}
          text={`${score}%`}
          styles={buildStyles({
            textSize: "22px",
            pathColor: rating.color,
            textColor: "var(--text-primary, #ffffff)",
            trailColor: "rgba(255, 255, 255, 0.1)",
            strokeLinecap: "round",
            pathTransitionDuration: 1.2,
          })}
        />
      </div>

      <p className="score-footer-note">
        Based on overall vulnerabilities, open ports, and security postures.
      </p>
    </div>
  );
}
