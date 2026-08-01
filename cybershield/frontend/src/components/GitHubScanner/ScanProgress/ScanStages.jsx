import { FaCheckCircle, FaSpinner, FaCircle } from "react-icons/fa";

export default function ScanStages({ stages, current }) {
  return (
    <div className="scan-stages">
      <h3 className="stages-title">Scan Stages</h3>
      <div className="stages-list">
        {stages.map((stage, index) => {
          const done = index < current;
          const active = index === current;

          return (
            <div
              key={index}
              className={`stage-row ${done ? "done" : active ? "active" : "pending"}`}
            >
              {done ? (
                <FaCheckCircle className="icon done" />
              ) : active ? (
                <FaSpinner className="icon active spin" />
              ) : (
                <FaCircle className="icon pending" />
              )}
              <span className="stage-name">{stage}</span>
              {active && <span className="running-label">running...</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
