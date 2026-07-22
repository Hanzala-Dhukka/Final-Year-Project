import { Clock, CheckCircle2, ShieldAlert, Award, FileText } from "lucide-react";

export default function ActivityTimeline({ activities = [] }) {
  const defaultActivities = [
    {
      title: "GitHub Scan Completed",
      time: "10:32 AM",
      timestamp: "2 minutes ago",
      type: "scan"
    },
    {
      title: "Quiz Completed - OWASP A01",
      time: "09:15 AM",
      timestamp: "1 hour ago",
      type: "quiz"
    },
    {
      title: "Threat Model Generated",
      time: "Yesterday",
      timestamp: "Yesterday",
      type: "threat"
    }
  ];

  const list = activities.length > 0 ? activities : defaultActivities;

  const getTypeIcon = (type) => {
    switch (type) {
      case "scan":
        return <CheckCircle2 size={16} className="text-green-400" />;
      case "quiz":
        return <Award size={16} className="text-blue-400" />;
      case "threat":
        return <ShieldAlert size={16} className="text-amber-400" />;
      default:
        return <FileText size={16} className="text-indigo-400" />;
    }
  };

  return (
    <div className="widget-card activity-timeline-widget">
      <div className="widget-header">
        <div className="header-title">
          <Clock className="widget-icon" />
          <h3>Security Activity Timeline</h3>
        </div>
      </div>

      <div className="timeline-list">
        {list.map((item, idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-icon-col">
              <div className="timeline-node">{getTypeIcon(item.type)}</div>
              {idx < list.length - 1 && <div className="timeline-line" />}
            </div>

            <div className="timeline-content">
              <div className="timeline-top">
                <h4>{item.title}</h4>
                <span className="time-badge">{item.time || item.timestamp}</span>
              </div>
              {item.timestamp && item.timestamp !== item.time && (
                <p className="timestamp-note">{item.timestamp}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
