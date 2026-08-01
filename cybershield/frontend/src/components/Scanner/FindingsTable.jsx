import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { updateFindingStatus } from "../../api/findingsApi";

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const SEVERITY_CONFIG = {
  Critical: {
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
    dot: "bg-red-500",
    highlight: "bg-red-500/10",
    icon: AlertCircle,
  },
  High: {
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-500",
    highlight: "bg-orange-500/10",
    icon: AlertTriangle,
  },
  Medium: {
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    dot: "bg-yellow-500",
    highlight: "bg-yellow-500/10",
    icon: Info,
  },
  Low: {
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    text: "text-green-400",
    dot: "bg-green-500",
    highlight: "bg-green-500/10",
    icon: Shield,
  },
};

const STATUS_OPTIONS = ["All", "Open", "Resolved", "False Positive"];

function getConfidenceColor(confidence) {
  if (confidence >= 95) return { bar: "bg-green-500", text: "text-green-400" };
  if (confidence >= 85) return { bar: "bg-blue-500", text: "text-blue-400" };
  if (confidence >= 70) return { bar: "bg-yellow-500", text: "text-yellow-400" };
  return { bar: "bg-gray-500", text: "text-gray-400" };
}

function getConfidenceLabel(confidence) {
  if (confidence >= 95) return "Very High";
  if (confidence >= 85) return "High";
  if (confidence >= 70) return "Medium";
  return "Low";
}

function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Medium;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.border} ${config.text}`}
    >
      <Icon size={12} />
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = {
    Open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Resolved: "bg-green-500/15 text-green-400 border-green-500/30",
    "False Positive": "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
        config[status] || config.Open
      }`}
    >
      {status}
    </span>
  );
}

function ConfidenceBar({ confidence }) {
  const color = getConfidenceColor(confidence);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color.bar}`}
          style={{ width: `${Math.min(confidence, 100)}%` }}
        />
      </div>
      <span className={`text-xs ${color.text}`}>
        {confidence}% · {getConfidenceLabel(confidence)}
      </span>
    </div>
  );
}

function CodeSnippet({ code, line, column }) {
  if (!code) return null;
  const lines = code.split("\n");
  const highlightLine = line || 1;
  const startLine = Math.max(1, highlightLine - 3);
  const endLine = Math.min(lines.length, highlightLine + 3);

  return (
    <div className="bg-gray-950 border border-gray-700/50 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-gray-500 font-mono">vulnerable code</span>
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-5">
        {lines.slice(startLine - 1, endLine).map((codeLine, idx) => {
          const lineNum = startLine + idx;
          const isHighlight = lineNum === highlightLine;
          return (
            <div
              key={lineNum}
              className={`flex ${
                isHighlight
                  ? "bg-red-500/10 border-l-2 border-red-500"
                  : "border-l-2 border-transparent"
              }`}
            >
              <span className="w-10 text-right pr-3 text-gray-600 select-none shrink-0 font-mono">
                {lineNum}
              </span>
              <code
                className={`font-mono ${
                  isHighlight ? "text-red-300" : "text-gray-400"
                }`}
              >
                {codeLine}
                {isHighlight && column && idx === 0 && (
                  <span className="text-red-400 opacity-50">
                    {" ".repeat(Math.max(0, column - 1))}^
                  </span>
                )}
              </code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function ExpandedRow({ finding }) {
  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={8} className="px-4 py-4 bg-gray-900/50 border-t border-gray-800/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <CodeSnippet
              code={finding.code}
              line={finding.line}
              column={finding.column}
            />
          </div>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield size={14} className="text-blue-400" />
                Finding Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {finding.owasp && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">OWASP</span>
                    <span className="text-white font-medium">{finding.owasp}</span>
                  </div>
                )}
                {finding.cwe && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">CWE</span>
                    <span className="text-white font-medium">{finding.cwe}</span>
                  </div>
                )}
                {finding.cvss && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">CVSS</span>
                    <span className="text-white font-medium">{finding.cvss}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block mb-0.5">Confidence</span>
                  <span className="text-white font-medium">
                    {finding.confidence}% · {getConfidenceLabel(finding.confidence)}
                  </span>
                </div>
              </div>
              {finding.description && (
                <div>
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">
                    Description
                  </span>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {finding.description}
                  </p>
                </div>
              )}
              {finding.rule && (
                <div>
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">
                    Rule
                  </span>
                  <span className="text-blue-400 text-xs font-mono">
                    {finding.rule}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateFindingStatus(finding.id, "resolved")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors"
              >
                <Check size={12} />
                Mark Resolved
              </button>
              <button
                onClick={() => updateFindingStatus(finding.id, "false_positive")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 border border-gray-500/30 text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-500/20 transition-colors"
              >
                <X size={12} />
                Mark False Positive
              </button>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

export default function FindingsTable({ findings = [], onFileClick, scanId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "severity", direction: "asc" });
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = useCallback((id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...findings];

    if (severityFilter !== "All") {
      result = result.filter((f) => f.severity === severityFilter);
    }

    if (statusFilter !== "All") {
      result = result.filter((f) => (f.status || "Open") === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          (f.file && f.file.toLowerCase().includes(term)) ||
          (f.rule && f.rule.toLowerCase().includes(term)) ||
          (f.code && f.code.toLowerCase().includes(term)) ||
          (f.type && f.type.toLowerCase().includes(term))
      );
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "severity":
          aVal = SEVERITY_ORDER[a.severity] ?? 4;
          bVal = SEVERITY_ORDER[b.severity] ?? 4;
          break;
        case "file":
          aVal = a.file || "";
          bVal = b.file || "";
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        case "line":
          aVal = a.line || 0;
          bVal = b.line || 0;
          break;
        case "rule":
          aVal = a.rule || "";
          bVal = b.rule || "";
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        case "confidence":
          aVal = a.confidence || 0;
          bVal = b.confidence || 0;
          break;
        case "owasp":
          aVal = a.owasp || "";
          bVal = b.owasp || "";
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        default:
          return 0;
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [findings, severityFilter, statusFilter, searchTerm, sortConfig]);

  const SortHeader = ({ columnKey, label }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <th
        className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
        onClick={() => handleSort(columnKey)}
      >
        <span className="flex items-center gap-1">
          {label}
          {isActive && (
            <ChevronDown
              size={12}
              className={`transition-transform ${
                sortConfig.direction === "desc" ? "rotate-180" : ""
              }`}
            />
          )}
        </span>
      </th>
    );
  };

  const severityCounts = useMemo(() => {
    const counts = { All: findings.length, Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const f of findings) {
      if (counts[f.severity] !== undefined) counts[f.severity]++;
    }
    return counts;
  }, [findings]);

  if (!findings || findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-4">
          <Shield size={28} className="text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No findings</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          No vulnerabilities were detected in this scan, or the data is still loading.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="space-y-3 mb-4">
        {/* Severity filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500" />
          {["All", "Critical", "High", "Medium", "Low"].map((sev) => {
            const isActive = severityFilter === sev;
            const config = SEVERITY_CONFIG[sev];
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? sev === "All"
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                      : `${config.bg} ${config.border} ${config.text}`
                    : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {sev !== "All" && <span className={`w-1.5 h-1.5 rounded-full ${config?.dot || "bg-gray-500"}`} />}
                {sev}
                <span className="text-[10px] opacity-70">({severityCounts[sev]})</span>
              </button>
            );
          })}
        </div>

        {/* Search and status filter row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by file, rule, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  statusFilter === status
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                    : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 mb-3">
        Showing {filteredAndSorted.length} of {findings.length} findings
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-800/50">
        <table className="w-full">
          <thead className="bg-gray-800/50 sticky top-0 z-10">
            <tr>
              <th className="w-8 px-2 py-3" />
              <SortHeader columnKey="severity" label="Severity" />
              <SortHeader columnKey="file" label="File" />
              <SortHeader columnKey="line" label="Line:Col" />
              <SortHeader columnKey="rule" label="Rule" />
              <SortHeader columnKey="confidence" label="Confidence" />
              <SortHeader columnKey="owasp" label="OWASP" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            <AnimatePresence>
              {filteredAndSorted.map((finding) => {
                const isExpanded = expandedRows.has(finding.id);
                return (
                  <motion.tr
                    key={finding.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <tr
                      onClick={() => toggleRow(finding.id)}
                      className={`cursor-pointer hover:bg-gray-800/30 transition-colors ${
                        isExpanded ? "bg-gray-800/20" : ""
                      }`}
                    >
                      <td className="px-2 py-3 text-center">
                        <span className="text-gray-500">
                          {isExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={finding.severity} />
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onFileClick) onFileClick(finding.file);
                        }}
                      >
                        <span className="text-sm text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 cursor-pointer">
                          {finding.file}
                          <ExternalLink size={10} className="opacity-50" />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-300 font-mono">
                          {finding.line || "-"}:{finding.column || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-300 font-mono truncate block max-w-[200px]">
                          {finding.rule || finding.type || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBar confidence={finding.confidence || 0} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{finding.owasp || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={finding.status || "Open"} />
                      </td>
                    </tr>
                    {isExpanded && <ExpandedRow finding={finding} />}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredAndSorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle size={24} className="text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">
              No findings match your current filters
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSeverityFilter("All");
                setStatusFilter("All");
              }}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
