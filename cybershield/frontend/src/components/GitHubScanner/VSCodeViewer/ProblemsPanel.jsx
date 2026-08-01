import { FaExclamationTriangle, FaExclamationCircle, FaInfoCircle, FaCheckCircle } from "react-icons/fa";
import "./ProblemsPanel.css";

const SEVERITY_ICON = {
  critical: <FaExclamationCircle />,
  high: <FaExclamationTriangle />,
  medium: <FaInfoCircle />,
  low: <FaCheckCircle />,
};

export default function ProblemsPanel({
  findings = [],
  onSelect
}) {
  return (
    <div className="problems-panel">
      <div className="problems-header">
        PROBLEMS
        {findings.length > 0 && (
          <span className="problems-count">{findings.length}</span>
        )}
      </div>
      <div className="problems-list">
        {findings.length === 0 ? (
          <div className="problems-empty">No issues in this file</div>
        ) : (
          findings.map((item, index) => (
            <div
              key={index}
              className={`problem severity-border-${(item.severity || "low").toLowerCase()}`}
              onClick={() => onSelect && onSelect(item)}
            >
              <div className="problem-icon">
                {SEVERITY_ICON[(item.severity || "low").toLowerCase()] || <FaInfoCircle />}
              </div>
              <div className="problem-info">
                <div className="problem-type">{item.type}</div>
                <div className="problem-meta">
                  <span className={`problem-severity sev-${(item.severity || "low").toLowerCase()}`}>
                    {item.severity}
                  </span>
                  <span className="problem-location">Line {item.line || "?"}</span>
                </div>
                {item.recommendation && (
                  <div className="problem-recommendation">{item.recommendation}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}