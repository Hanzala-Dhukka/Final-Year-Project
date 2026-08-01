import { FiClock } from "react-icons/fi";

export default function ETAWidget({ eta = "", filesCompleted = 0, filesTotal = 0 }) {
  return (
    <div className="eta-widget">
      <div className="eta-icon">
        <FiClock />
      </div>
      <div className="eta-content">
        <span className="eta-label">Estimated Time</span>
        <span className="eta-value">{eta || "Calculating..."}</span>
      </div>
      <div className="eta-files">
        <span className="eta-files-count">{filesCompleted}</span>
        <span className="eta-files-sep">/</span>
        <span className="eta-files-total">{filesTotal}</span>
        <span className="eta-files-label">files</span>
      </div>
    </div>
  );
}
