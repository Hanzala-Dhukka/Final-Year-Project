import { useState } from "react";
import {
  Bot,
  ShieldAlert,
  Briefcase,
  Sparkles,
  Lightbulb,
  Target,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import MarkdownRenderer from "../AIAssistant/MarkdownRenderer";

const SECTION_META = {
  outcome: { icon: Target, color: "#3b82f6", label: "Outcome" },
  "why it worked": { icon: AlertTriangle, color: "#f97316", label: "Why It Worked" },
  "business impact": { icon: Briefcase, color: "#ef4444", label: "Business Impact" },
  "how to fix": { icon: CheckCircle2, color: "#22c55e", label: "How to Fix" },
  "owasp reference": { icon: BookOpen, color: "#8b5cf6", label: "OWASP Reference" },
  "best practices": { icon: Sparkles, color: "#06b6d4", label: "Best Practices" },
};

function parseSections(markdown) {
  if (!markdown) return [];
  const sections = [];
  const lines = markdown.split("\n");
  let currentSection = null;

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,4}\s+(.+)/);
    if (headerMatch) {
      const title = headerMatch[1].trim();
      const titleLower = title.toLowerCase();
      let matchedKey = null;
      for (const key of Object.keys(SECTION_META)) {
        if (titleLower.includes(key)) {
          matchedKey = key;
          break;
        }
      }
      if (matchedKey) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          key: matchedKey,
          title: SECTION_META[matchedKey].label,
          meta: SECTION_META[matchedKey],
          content: "",
        };
        continue;
      }
    }
    if (currentSection) {
      currentSection.content += line + "\n";
    }
  }
  if (currentSection) sections.push(currentSection);

  return sections;
}

function SectionBlock({ section, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.meta.icon;

  return (
    <div className="cs-ow-ai-section">
      <button
        className="cs-ow-ai-section-toggle"
        onClick={() => setOpen(!open)}
        style={{ "--section-color": section.meta.color }}
      >
        <span className="cs-ow-ai-section-icon" style={{ background: `${section.meta.color}20`, color: section.meta.color }}>
          <Icon size={14} />
        </span>
        <span className="cs-ow-ai-section-title">{section.title}</span>
        <span className="cs-ow-ai-section-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {open && (
        <div className="cs-ow-ai-section-body">
          <MarkdownRenderer content={section.content.trim()} />
        </div>
      )}
    </div>
  );
}

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

  const sections = parseSections(explanation);
  const hasStructuredSections = sections.length >= 2;

  return (
    <div className="cs-ow-ai">
      <div className="cs-ow-ai-head">
        <div className="cs-ow-ai-head-left">
          <span className="cs-ow-ai-avatar">
            <Bot size={18} />
          </span>
          <div>
            <h4>AI Coach</h4>
            {provider && <span className="cs-ow-provider">via {provider}</span>}
          </div>
        </div>
        {owasp && (
          <span className="cs-ow-chip cs-ow-chip--danger">
            <ShieldAlert size={11} /> {owasp}
          </span>
        )}
      </div>

      {hasStructuredSections ? (
        <div className="cs-ow-ai-sections">
          {sections.map((section, i) => (
            <SectionBlock key={i} section={section} defaultOpen={i < 2} />
          ))}
        </div>
      ) : (
        explanation && (
          <div className="cs-ow-markdown">
            <MarkdownRenderer content={explanation} />
          </div>
        )
      )}

      {businessImpact && (
        <div className="cs-ow-ai-info-card cs-ow-ai-info-card--impact">
          <Briefcase size={15} />
          <div>
            <b>Business Impact</b>
            <p>{businessImpact}</p>
          </div>
        </div>
      )}

      {hasPractices && (
        <div className="cs-ow-ai-info-card cs-ow-ai-info-card--practices">
          <Sparkles size={15} />
          <div>
            <b>Best Practices</b>
            <ul>
              {bestPractices.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {hasFix && (
        <div className="cs-ow-ai-info-card cs-ow-ai-info-card--fix">
          <Code2 size={15} />
          <div>
            <b>How to Fix</b>
            {fix && <p>{fix}</p>}
            {secureCodeExample && (
              <code className="cs-ow-code">{secureCodeExample}</code>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
