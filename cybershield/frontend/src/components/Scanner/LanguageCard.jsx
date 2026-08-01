import { motion } from "framer-motion";
import { FiCode } from "react-icons/fi";

const languageColors = {
  Python: "#3572A5",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Scala: "#c22d40",
  R: "#198CE7",
  Lua: "#000080",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

export default function LanguageCard({ languages = {} }) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const maxVal = entries.length > 0 ? entries[0][1] : 100;

  if (entries.length === 0) {
    return (
      <div className="widget-card">
        <div className="widget-header">
          <FiCode />
          <h2>Languages</h2>
        </div>
        <p className="lang-empty">No languages detected</p>
      </div>
    );
  }

  return (
    <div className="widget-card">
      <div className="widget-header">
        <FiCode />
        <h2>Languages</h2>
        <span className="lang-count">{entries.length} languages</span>
      </div>

      {/* Stacked bar */}
      <div className="lang-bar">
        {entries.map(([name, pct], i) => (
          <div
            key={name}
            className="lang-bar-segment"
            style={{
              width: `${(pct / 100) * 100}%`,
              background: languageColors[name] || `hsl(${i * 40}, 50%, 50%)`,
            }}
            title={`${name}: ${pct}%`}
          />
        ))}
      </div>

      {/* Language list */}
      <div className="lang-list">
        {entries.map(([name, pct], i) => (
          <div key={name} className="lang-item">
            <span
              className="lang-dot"
              style={{ background: languageColors[name] || `hsl(${i * 40}, 50%, 50%)` }}
            />
            <span className="lang-name">{name}</span>
            <span className="lang-pct">{pct}%</span>
            <div className="lang-bar-bg">
              <div
                className="lang-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: languageColors[name] || `hsl(${i * 40}, 50%, 50%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
