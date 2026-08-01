import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Search,
  Loader2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";

// ── Child Components ─────────────────────────────────────────────────────
import ExecutiveSummary from "../../components/Reports/ExecutiveSummary";
import VulnerabilityChart from "../../components/Reports/VulnerabilityChart";
import SecurityTrend from "../../components/Reports/SecurityTrend";
import ReportActions from "../../components/Reports/ReportActions";
import CompareScans from "../../components/Reports/CompareScans";
import ReportHistory from "../../components/Reports/ReportHistory";

// ── API ──────────────────────────────────────────────────────────────────
import {
  generateReport,
  getScoreHistory,
  getReportHistory,
} from "../../api/reportApi";

// ── Animation Variants ───────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -8 },
};

const sectionVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ── Severity filter config ───────────────────────────────────────────────
const SEVERITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"];

const severityColor = (level) => {
  switch (level) {
    case "Critical":
      return "text-red-400 bg-red-500/15 border-red-500/30";
    case "High":
      return "text-orange-400 bg-orange-500/15 border-orange-500/30";
    case "Medium":
      return "text-yellow-400 bg-yellow-500/15 border-yellow-500/30";
    case "Low":
      return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
    default:
      return "text-gray-400 bg-gray-500/15 border-gray-500/30";
  }
};

// ══════════════════════════════════════════════════════════════════════════
// SecurityReport Page
// ══════════════════════════════════════════════════════════════════════════
export default function SecurityReport() {
  // ── State ───────────────────────────────────────────────────────────────
  const [report, setReport] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [scanId, setScanId] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  // ── On mount: try to load most recent report ────────────────────────────
  useEffect(() => {
    const loadInitial = async () => {
      setInitialLoading(true);
      try {
        const [histRes, scoreRes] = await Promise.allSettled([
          getReportHistory(1),
          getScoreHistory(),
        ]);

        if (histRes.status === "fulfilled") {
          const reports = histRes.value.data?.reports || histRes.value.data || [];
          if (reports.length > 0) {
            setReport(reports[0]);
          }
        }

        if (scoreRes.status === "fulfilled") {
          setScoreHistory(scoreRes.value.data?.history || scoreRes.value.data || []);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitial();
  }, []);

  // ── Generate report ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!scanId.trim()) return;
    setLoading(true);
    try {
      const res = await generateReport(scanId.trim());
      setReport(res.data?.report || res.data);

      // Refresh score history
      const scoreRes = await getScoreHistory();
      setScoreHistory(scoreRes.data?.history || scoreRes.data || []);

      setSeverityFilter("All");
      setSearchQuery("");
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived: vulnerabilities list ────────────────────────────────────────
  const vulnerabilities = useMemo(() => {
    if (!report) return [];
    return report.vulnerabilities || report.findings || [];
  }, [report]);

  // ── Filtered + sorted vulnerabilities ────────────────────────────────────
  const filteredVulns = useMemo(() => {
    let list = [...vulnerabilities];

    // Severity filter
    if (severityFilter !== "All") {
      list = list.filter(
        (v) => (v.severity || v.risk_level || "").toLowerCase() === severityFilter.toLowerCase()
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          (v.title || v.name || v.vulnerability || "").toLowerCase().includes(q) ||
          (v.description || v.summary || "").toLowerCase().includes(q) ||
          (v.file || v.file_path || v.location || "").toLowerCase().includes(q) ||
          (v.cwe_id || v.cwe || "").toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortConfig.key) {
      list.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? "";
        const bVal = b[sortConfig.key] ?? "";
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.dir === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortConfig.dir === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return list;
  }, [vulnerabilities, severityFilter, searchQuery, sortConfig]);

  // ── Sort toggle ─────────────────────────────────────────────────────────
  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.dir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />
    );
  };

  // ── Vulnerability counts ────────────────────────────────────────────────
  const vulnCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    vulnerabilities.forEach((v) => {
      const sev = v.severity || v.risk_level || "";
      if (counts[sev] !== undefined) counts[sev]++;
    });
    return counts;
  }, [vulnerabilities]);

  // ══════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gray-950 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── 1. Page Header ──────────────────────────────────────────────── */}
        <motion.div variants={sectionVariants} initial="initial" animate="animate" className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/15 rounded-xl border border-blue-500/20">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Security Report</h1>
            <p className="text-gray-400 text-sm mt-0.5">Professional Security Analysis &amp; Reporting</p>
          </div>
        </motion.div>

        {/* ── 2. Scan Selector ────────────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.05 }}
          className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
        >
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter Scan ID to Generate Report
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={scanId}
                onChange={(e) => setScanId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g. scan_abc123..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={!scanId.trim() || loading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              <span>{loading ? "Generating..." : "Generate Report"}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── Loading / Empty States ──────────────────────────────────────── */}
        {initialLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}

        {!initialLoading && !report && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <AlertTriangle className="w-12 h-12 mb-3 text-gray-600" />
            <p className="text-sm">No report loaded. Enter a scan ID above to generate one.</p>
          </div>
        )}

        {/* ── Report Content ──────────────────────────────────────────────── */}
        {report && (
          <>
            {/* ── 3. Executive Summary ──────────────────────────────────────── */}
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
            >
              <ExecutiveSummary report={report} />
            </motion.div>

            {/* ── 4. Charts Row ────────────────────────────────────────────── */}
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <VulnerabilityChart report={report} />
              <SecurityTrend scoreHistory={scoreHistory} />
            </motion.div>

            {/* ── 5. Report Actions ─────────────────────────────────────────── */}
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
              className="bg-gray-900/80 border border-gray-800 rounded-xl p-5"
            >
              <ReportActions reportId={report.report_id} report={report} />
            </motion.div>

            {/* ── 6. Vulnerability Findings Table ──────────────────────────── */}
            <motion.div
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.25 }}
              className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Table header */}
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Vulnerability Findings</h3>
                    <span className="text-xs text-gray-500 ml-1">({filteredVulns.length})</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search findings..."
                      className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>

                {/* Severity filter buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {SEVERITY_FILTERS.map((sev) => {
                    const isActive = severityFilter === sev;
                    const count = sev === "All" ? vulnerabilities.length : vulnCounts[sev];
                    return (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isActive
                            ? sev === "All"
                              ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                              : severityColor(sev)
                            : "bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                        }`}
                      >
                        {sev}
                        {count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isActive ? "bg-white/10" : "bg-gray-700"
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400 text-xs uppercase tracking-wider">
                      {[
                        { key: "title", label: "Title" },
                        { key: "severity", label: "Severity" },
                        { key: "cwe_id", label: "CWE" },
                        { key: "file", label: "File" },
                        { key: "line", label: "Line" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          onClick={() => toggleSort(col.key)}
                          className="px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors select-none"
                        >
                          {col.label}
                          <SortIcon columnKey={col.key} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVulns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                          No vulnerabilities match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredVulns.map((v, idx) => (
                        <tr
                          key={v.id || v.vulnerability_id || idx}
                          className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-200 max-w-xs truncate">
                            {v.title || v.name || v.vulnerability || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                severityColor(v.severity || v.risk_level)
                              }`}
                            >
                              {v.severity || v.risk_level || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">
                            {v.cwe_id || v.cwe || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                            {v.file || v.file_path || v.location || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {v.line || v.line_number || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        {/* ── 7. Compare Scans ─────────────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <CompareScans />
        </motion.div>

        {/* ── 8. Report History ────────────────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.35 }}
        >
          <ReportHistory />
        </motion.div>
      </div>
    </motion.div>
  );
}
