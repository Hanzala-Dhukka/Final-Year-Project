import { useMemo, useCallback, useRef, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Shield,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/**
 * FindingList — panel showing vulnerabilities for the current file,
 * sorted by line number, with keyboard navigation.
 *
 * Props:
 *   findings        – array of finding objects
 *   activeFinding   – currently selected finding (or null)
 *   onFindingClick  – callback(finding)
 */

const SEVERITY_CONFIG = {
  Critical: {
    dot: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: AlertCircle,
  },
  High: {
    dot: "bg-orange-500",
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: AlertTriangle,
  },
  Medium: {
    dot: "bg-yellow-500",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: Info,
  },
  Low: {
    dot: "bg-green-500",
    text: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: Shield,
  },
};

export default function FindingList({ findings = [], activeFinding, onFindingClick }) {
  const listRef = useRef(null);

  const sorted = useMemo(
    () => [...findings].sort((a, b) => (a.line || 0) - (b.line || 0)),
    [findings]
  );

  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const f of sorted) {
      if (counts[f.severity] !== undefined) counts[f.severity]++;
    }
    return counts;
  }, [sorted]);

  const activeIndex = useMemo(() => {
    if (!activeFinding) return -1;
    return sorted.findIndex(
      (f) =>
        (f._id && f._id === activeFinding._id) ||
        (f.line === activeFinding.line && f.file === activeFinding.file)
    );
  }, [sorted, activeFinding]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (sorted.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = activeIndex < sorted.length - 1 ? activeIndex + 1 : 0;
        onFindingClick?.(sorted[next]);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prev = activeIndex > 0 ? activeIndex - 1 : sorted.length - 1;
        onFindingClick?.(sorted[prev]);
      }
    },
    [sorted, activeIndex, onFindingClick]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex];
      if (item) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  // Empty state
  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-3">
          <Shield size={20} className="text-gray-600" />
        </div>
        <p className="text-sm text-gray-500">No vulnerabilities found in this file</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">
            Vulnerabilities ({sorted.length})
          </h3>
          <div className="flex items-center gap-1 text-[10px]">
            {Object.entries(severityCounts)
              .filter(([, count]) => count > 0)
              .map(([severity, count]) => {
                const config = SEVERITY_CONFIG[severity];
                return (
                  <span
                    key={severity}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {count}
                  </span>
                );
              })}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <ChevronUp size={10} />
          <ChevronDown size={10} />
          <span>to navigate</span>
        </div>
      </div>

      {/* Finding list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {sorted.map((finding, index) => {
          const severity = finding.severity || "Medium";
          const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Medium;
          const Icon = config.icon;
          const isActive =
            activeFinding &&
            ((finding._id && finding._id === activeFinding._id) ||
              (finding.line === activeFinding.line &&
                finding.file === activeFinding.file));

          return (
            <button
              key={finding._id || `${finding.file}-${finding.line}-${index}`}
              onClick={() => onFindingClick?.(finding)}
              className={`w-full text-left px-4 py-2.5 border-b border-gray-700/30 transition-colors ${
                isActive
                  ? "bg-blue-500/15 border-l-2 border-l-blue-500"
                  : "hover:bg-gray-800/40 border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Severity indicator */}
                <span
                  className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center ${config.bg} border ${config.border}`}
                >
                  <Icon size={12} className={config.text} />
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-medium truncate ${
                        isActive ? "text-blue-300" : "text-gray-200"
                      }`}
                    >
                      {finding.rule_name || finding.type || "Unknown Rule"}
                    </span>
                    <span className="flex-shrink-0 text-[10px] text-gray-500 font-mono">
                      Ln {finding.line || "?"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium ${config.text}`}>
                      {severity}
                    </span>
                    {finding.confidence != null && (
                      <span className="text-[10px] text-gray-500">
                        {finding.confidence}% conf.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
