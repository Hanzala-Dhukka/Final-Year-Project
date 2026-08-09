import { ScanSearch, FileWarning, Swords, HelpCircle, BookOpen, Sparkles } from "lucide-react";

/**
 * Context domain dropdown for the AI Assistant (Module 5.2).
 * Selecting a domain tells the assistant which CyberShield data to focus on.
 */
const CONTEXTS = [
  { value: "general", label: "General", icon: Sparkles },
  { value: "github_scan", label: "GitHub Scanner", icon: ScanSearch },
  { value: "threat_report", label: "Threat Reports", icon: FileWarning },
  { value: "owasp", label: "OWASP Simulator", icon: Swords },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "glossary", label: "Glossary", icon: BookOpen },
];

export default function ContextSelector({ value, onChange }) {
  const active = CONTEXTS.find((c) => c.value === value) || CONTEXTS[0];
  const ActiveIcon = active.icon;

  return (
    <span className="cs-ai-field">
      <span className="cs-ai-select__label">Context:</span>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <ActiveIcon
          size={14}
          style={{
            position: "absolute",
            left: 11,
            zIndex: 1,
            color: "var(--primary, #2563eb)",
            pointerEvents: "none",
          }}
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cs-ai-select"
          style={{ paddingLeft: 32 }}
        >
          {CONTEXTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </span>
    </span>
  );
}

export { CONTEXTS };