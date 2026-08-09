import { Target, Sparkles } from "lucide-react";

/**
 * Scenario card (spec Step 15). Shows the vulnerability scenario description,
 * difficulty, and the input field/example.
 */
export default function ScenarioCard({ simulation, onAskAI }) {
  if (!simulation) return null;

  return (
    <div className="cs-ow-scenario">
      <div className="cs-ow-scenario-head">
        <h2>{simulation.title || simulation.vulnerability}</h2>
        <div className="cs-ow-scenario-tags">
          <span className="cs-ow-chip cs-ow-chip--neutral">{simulation.difficulty}</span>
          <span className="cs-ow-chip cs-ow-chip--purple">
            <Target size={11} /> {simulation.mode === "defense" ? "Defense" : "Attack"}
          </span>
        </div>
      </div>

      {simulation.scenario && <p>{simulation.scenario}</p>}

      {simulation.field && (
        <div className="cs-ow-kv">
          Target field: <code className="cs-ow-code" style={{ display: "inline", padding: "2px 8px" }}>
            {simulation.field}
          </code>
        </div>
      )}

      {simulation.example_payload && (
        <div className="cs-ow-kv">
          Example:
          <code className="cs-ow-code" style={{ display: "inline", padding: "2px 8px" }}>
            {simulation.example_payload}
          </code>
        </div>
      )}

      {simulation.learning_path && simulation.learning_path.length > 0 && (
        <div className="cs-ow-path">
          <span className="cs-ow-path-title">Learning path</span>
          <div className="cs-ow-path-items">
            {simulation.learning_path.map((step) => (
              <span key={step} className="cs-ow-chip cs-ow-chip--info">
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {onAskAI && (
        <div className="cs-ow-editor-actions" style={{ marginTop: 14 }}>
          <button className="cs-ow-btn cs-ow-btn--ghost cs-ow-btn-sm" onClick={onAskAI}>
            <Sparkles size={14} /> Ask AI
          </button>
        </div>
      )}
    </div>
  );
}