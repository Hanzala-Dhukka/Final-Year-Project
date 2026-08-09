/**
 * Progress bar (spec Step 14). Shows answered/total as a filled bar.
 */
export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="cs-qz-progress">
      <div className="cs-qz-progress__head">
        <span>
          Question <strong>{Math.min(current + 1, total)}</strong> / {total}
        </span>
        <span>{pct}% complete</span>
      </div>
      <div className="cs-qz-progress__track">
        <div className="cs-qz-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}