import { Award, Lock, CheckCircle2 } from "lucide-react";

export default function AchievementWidget({ achievements = [] }) {
  const defaultAchievements = [
    {
      id: "1",
      title: "GitHub Scanner Expert",
      description: "Completed 10+ GitHub repository scans",
      unlocked: true,
      icon: "🔍"
    },
    {
      id: "2",
      title: "OWASP Beginner",
      description: "Completed top 3 OWASP Top 10 labs",
      unlocked: true,
      icon: "🛡️"
    },
    {
      id: "3",
      title: "Quiz Master",
      description: "Scored 100% on 5 security quizzes",
      unlocked: true,
      icon: "🎓"
    },
    {
      id: "4",
      title: "Threat Hunter",
      description: "Generated 5 comprehensive threat models",
      unlocked: false,
      icon: "🎯"
    }
  ];

  const list = achievements.length > 0 ? achievements : defaultAchievements;

  return (
    <div className="widget-card achievement-widget">
      <div className="widget-header">
        <div className="header-title">
          <Award className="widget-icon" />
          <h3>Achievements</h3>
        </div>
        <span className="achievement-count">
          {list.filter((a) => a.unlocked).length} / {list.length} Unlocked
        </span>
      </div>

      <div className="achievements-grid">
        {list.map((item) => (
          <div
            key={item.id || item.title}
            className={`achievement-card ${item.unlocked ? "unlocked" : "locked"}`}
          >
            <div className="achievement-icon">
              <span>{item.icon || "🏆"}</span>
              {!item.unlocked && <Lock size={14} className="lock-overlay" />}
            </div>
            <div className="achievement-info">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
            <div className="status-indicator">
              {item.unlocked ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <span className="locked-text">Locked</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
