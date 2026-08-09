import { Bot, ShieldAlert, Briefcase, Sparkles } from "lucide-react";
import MarkdownRenderer from "../AIAssistant/MarkdownRenderer";

/**
 * AI Coach explanation block (spec Step 18). Renders markdown from the coach,
 * plus optional OWASP reference / business impact / fix chips.
 */
export default function AIExplanation({
  explanation,
  provider,
  owasp,
  businessImpact,
  fix,
  bestPractices,
  secureCodeExample,
}) {
  const hasFix = fix || secureCodeExample;
  const hasPractices = bestPractices && bestPractices.length > 0;

  if (!explanation && !owasp && !businessImpact && !hasFix && !hasPractices) return null;

  return (
    <div className="cs-ow-ai">
      <div className="cs-ow-ai-head">
        <h4>
          <Bot size={17} /> AI Coach
        </h4>
        {provider && <span className="cs-ow-provider">via {provider}</span>}
      </div>

      {owasp && (
        <div style={{ marginBottom: 10 }}>
          <span className="cs-ow-chip cs-ow-chip--danger">
            <ShieldAlert size={11} /> {owasp}
          </span>
        </div>
      )}

      {explanation && (
        <div className="cs-ow-markdown">
          <MarkdownRenderer content={explanation} />
        </div>
      )}

      {businessImpact && (
        <div className="cs-ow-kv" style={{ marginTop: 10, alignItems: "flex-start" }}>
          <Briefcase size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b className="cs-ow-path-title">Business impact</b>
            <p className="cs-ow-para" style={{ marginTop: 4 }}>{businessImpact}</p>
          </div>
        </div>
      )}

      {hasPractices && (
        <div style={{ marginTop: 12 }}>
          <span className="cs-ow-path-title">Best practices</span>
          <ul className="cs-ow-list" style={{ marginTop: 8 }}>
            {bestPractices.map((p, i) => (
              <li key={i}>
                <Sparkles size={14} style={{ color: "var(--success, #22c55e)" }} /> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(fix || secureCodeExample) && (
        <div style={{ marginTop: 12 }}>
          <span className="cs-ow-path-title">How to fix</span>
          {fix && <p className="cs-ow-para" style={{ marginTop: 6 }}>{fix}</p>}
          {secureCodeExample && (
            <code className="cs-ow-code" style={{ marginTop: 8 }}>
              {secureCodeExample}
            </code>
          )}
        </div>
      )}
    </div>
  );
}