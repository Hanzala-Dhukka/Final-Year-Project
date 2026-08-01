export default function ScanStats({
  elapsed,
  remaining,
  progress,
  risk,
  files,
}) {
  return (
    <div className="scan-stats">
      <div className="stat-box">
        <h4>Elapsed</h4>
        <p>{elapsed}</p>
      </div>
      <div className="stat-box">
        <h4>Remaining</h4>
        <p>{remaining}</p>
      </div>
      <div className="stat-box">
        <h4>Progress</h4>
        <p>{progress}%</p>
      </div>
      <div className="stat-box">
        <h4>Risk</h4>
        <p className={`risk-tag risk-${String(risk).toLowerCase()}`}>{risk}</p>
      </div>
      <div className="stat-box">
        <h4>Files</h4>
        <p>{files}</p>
      </div>
    </div>
  );
}
