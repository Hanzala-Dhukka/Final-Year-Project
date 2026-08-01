export default function ProgressBar({ progress }) {
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-container">
      <div className="progress-header-row">
        <span>Overall Progress</span>
        <span className="progress-percent-text">{percentage}%</span>
      </div>
      <div className="progress-wrapper">
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
