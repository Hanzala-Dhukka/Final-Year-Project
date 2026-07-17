/**
 * Context domain dropdown for the AI Assistant (Module 5.2).
 * Selecting a domain tells the assistant which CyberShield data to focus on.
 */
const CONTEXTS = [
  { value: "general", label: "General" },
  { value: "github_scan", label: "GitHub Scanner" },
  { value: "threat_report", label: "Threat Reports" },
  { value: "owasp", label: "OWASP Simulator" },
  { value: "quiz", label: "Quiz" },
  { value: "glossary", label: "Glossary" },
];

export default function ContextSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {CONTEXTS.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

export { CONTEXTS };
