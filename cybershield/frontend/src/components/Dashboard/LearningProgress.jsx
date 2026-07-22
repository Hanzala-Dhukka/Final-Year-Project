import { Zap, Award, Target } from "lucide-react";

export default function LearningProgress({
  progress = 65,
  xp = 1820,
  level = 4,
  nextLevelXp = 2500
}) {
  const currentLevelMinXp = (level - 1) * 500;
  const xpInCurrentLevel = xp - currentLevelMinXp;
  const totalXpForCurrentLevel = nextLevelXp - currentLevelMinXp;
  const calculatedPct = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / (totalXpForCurrentLevel || 1)) * 100))
  );

  return (
    <div className="widget-card learning-progress-widget">
      <div className="widget-header">
        <div className="header-title">
          <Zap className="widget-icon" />
          <h3>Learning Progress</h3>
        </div>
        <span className="level-badge">Level {level}</span>
      </div>

      <div className="progress-metrics">
        <div className="metric">
          <span className="label">Current XP</span>
          <span className="value">{xp} XP</span>
        </div>
        <div className="metric">
          <span className="label">Next Level Target</span>
          <span className="value">{nextLevelXp} XP</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${calculatedPct || progress}%` }}
        />
      </div>

      <div className="progress-footer">
        <span>{calculatedPct || progress}% complete</span>
        <span>{nextLevelXp - xp} XP to Level {level + 1}</span>
      </div>
    </div>
  );
}
