import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function SecurityScoreCard({ score = 85 }) {
  const getScoreColor = (s) => {
    if (s >= 80) return "#22c55e"; // green
    if (s >= 60) return "#eab308"; // yellow
    if (s >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const pathColor = getScoreColor(score);

  return (
    <div className="security-card">
      <h3>Security Score</h3>
      <div className="circular-container">
        <CircularProgressbar
          value={score}
          text={`${score}%`}
          styles={buildStyles({
            textSize: "22px",
            pathColor: pathColor,
            textColor: "var(--text-primary, #ffffff)",
            trailColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "transparent",
            strokeLinecap: "round",
            pathTransitionDuration: 0.8,
          })}
        />
      </div>
    </div>
  );
}