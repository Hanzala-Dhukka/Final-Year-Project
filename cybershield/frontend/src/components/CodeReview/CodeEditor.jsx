/**
 * Simple code paste editor with a language dropdown.
 */
const LANGUAGES = [
  "Python", "JavaScript", "TypeScript", "Java", "PHP", "Go",
  "C#", "C++", "C", "HTML", "CSS", "SQL", "Shell",
];

export default function CodeEditor({ code, onCodeChange, language, onLanguageChange, disabled }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm text-gray-500">Language:</label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          disabled={disabled}
        >
          <option value="">Auto-detect</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <textarea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        placeholder="Paste your code here to review..."
        rows={12}
        spellCheck={false}
        className="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled}
      />
    </div>
  );
}
