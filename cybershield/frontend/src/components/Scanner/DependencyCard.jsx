import { motion } from "framer-motion";
import { FiPackage } from "react-icons/fi";

const ecosystemColors = {
  python: "#3572A5",
  node: "#68A063",
  java: "#b07219",
  go: "#00ADD8",
  rust: "#dea584",
  ruby: "#701516",
  php: "#4F5D95",
  dart: "#00B4AB",
  ios: "#A2AAAD",
  swift: "#F05138",
};

export default function DependencyCard({ dependencies = [], dependencyFiles = [] }) {
  if (dependencies.length === 0 && dependencyFiles.length === 0) {
    return (
      <div className="widget-card">
        <div className="widget-header">
          <FiPackage />
          <h2>Dependencies</h2>
        </div>
        <p className="dep-empty">No dependency files detected</p>
      </div>
    );
  }

  return (
    <div className="widget-card">
      <div className="widget-header">
        <FiPackage />
        <h2>Dependencies</h2>
        <span className="dep-count">{dependencies.length} ecosystems</span>
      </div>

      <div className="dep-ecosystems">
        {dependencies.map((eco) => (
          <span
            key={eco}
            className="dep-ecosystem-badge"
            style={{
              color: ecosystemColors[eco] || "#94a3b8",
              borderColor: ecosystemColors[eco] || "#94a3b8",
            }}
          >
            {eco}
          </span>
        ))}
      </div>

      {dependencyFiles.length > 0 && (
        <div className="dep-files">
          <span className="dep-files-label">Manifest files:</span>
          {dependencyFiles.map((f) => (
            <span key={f} className="dep-file-tag">{f.split("/").pop()}</span>
          ))}
        </div>
      )}
    </div>
  );
}
