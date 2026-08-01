import { useState, useCallback } from "react";
import {
  Search,
  Map,
  WrapText,
  Maximize,
  Minimize,
  Copy,
  Download,
  ChevronRight,
  FileCode,
} from "lucide-react";

/**
 * CodeViewerToolbar — breadcrumb navigation and action buttons for the code viewer.
 *
 * Props:
 *   filePath         – full file path string (e.g. "backend/routes/auth.py")
 *   language         – language label (e.g. "Python")
 *   onSearch         – callback to trigger Monaco's find widget
 *   onToggleMinimap  – callback to toggle minimap visibility
 *   onToggleWrap     – callback to toggle word wrap
 *   onToggleFullscreen – callback to toggle fullscreen mode
 *   onDownload       – callback to download the file
 *   onCopyPath       – callback to copy file path to clipboard
 */

function ToolbarButton({ icon: Icon, label, onClick, active, className = "" }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-1.5 rounded-md transition-colors ${
          active
            ? "bg-blue-500/20 text-blue-400"
            : "text-gray-400 hover:text-white hover:bg-gray-700/50"
        } ${className}`}
        title={label}
      >
        <Icon size={15} />
      </button>
      {showTooltip && (
        <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300 whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
}

export default function CodeViewerToolbar({
  filePath = "",
  language = "",
  onSearch,
  onToggleMinimap,
  onToggleWrap,
  onToggleFullscreen,
  onDownload,
  onCopyPath,
}) {
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [wrapEnabled, setWrapEnabled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pathSegments = filePath
    ? filePath.split(/[\\/]/).filter(Boolean)
    : [];

  const handleMinimap = useCallback(() => {
    setMinimapEnabled((prev) => !prev);
    onToggleMinimap?.();
  }, [onToggleMinimap]);

  const handleWrap = useCallback(() => {
    setWrapEnabled((prev) => !prev);
    onToggleWrap?.();
  }, [onToggleWrap]);

  const handleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
    onToggleFullscreen?.();
  }, [onToggleFullscreen]);

  const handleCopyPath = useCallback(() => {
    if (filePath) {
      navigator.clipboard.writeText(filePath).then(() => {
        setCopied(true);
        onCopyPath?.();
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [filePath, onCopyPath]);

  // Map common language identifiers to display names
  const languageDisplay =
    {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      java: "Java",
      go: "Go",
      rust: "Rust",
      cpp: "C++",
      c: "C",
      csharp: "C#",
      ruby: "Ruby",
      php: "PHP",
      swift: "Swift",
      kotlin: "Kotlin",
      sql: "SQL",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      yaml: "YAML",
      xml: "XML",
      markdown: "Markdown",
      shell: "Shell",
      bash: "Bash",
      dockerfile: "Dockerfile",
      plaintext: "Text",
    }[language?.toLowerCase()] || language || "Unknown";

  return (
    <div className="flex items-center justify-between h-10 px-3 bg-gray-800/60 border-b border-gray-700/50">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <FileCode size={14} className="text-gray-500 flex-shrink-0" />
        <div className="flex items-center gap-0.5 min-w-0 overflow-hidden">
          {pathSegments.map((segment, i) => (
            <div key={i} className="flex items-center gap-0.5 min-w-0">
              {i > 0 && (
                <ChevronRight size={10} className="text-gray-600 flex-shrink-0" />
              )}
              <span
                className={`text-xs truncate ${
                  i === pathSegments.length - 1
                    ? "text-gray-200 font-medium"
                    : "text-gray-500"
                }`}
              >
                {segment}
              </span>
            </div>
          ))}
          {pathSegments.length === 0 && (
            <span className="text-xs text-gray-600 italic">No file selected</span>
          )}
        </div>
      </div>

      {/* Center: Language badge */}
      <div className="flex-shrink-0 mx-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-medium text-blue-400">
          {languageDisplay}
        </span>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <ToolbarButton icon={Search} label="Find (Ctrl+F)" onClick={onSearch} />
        <div className="w-px h-4 bg-gray-700/50 mx-1" />
        <ToolbarButton
          icon={Map}
          label="Toggle Minimap"
          onClick={handleMinimap}
          active={minimapEnabled}
        />
        <ToolbarButton
          icon={WrapText}
          label="Toggle Word Wrap"
          onClick={handleWrap}
          active={wrapEnabled}
        />
        <ToolbarButton
          icon={fullscreen ? Minimize : Maximize}
          label={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          onClick={handleFullscreen}
        />
        <div className="w-px h-4 bg-gray-700/50 mx-1" />
        <ToolbarButton
          icon={Copy}
          label={copied ? "Copied!" : "Copy Path"}
          onClick={handleCopyPath}
        />
        <ToolbarButton icon={Download} label="Download" onClick={onDownload} />
      </div>
    </div>
  );
}
