import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Download,
  Trash2,
  FileText,
  ChevronDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { getReportHistory, deleteReport } from "../../api/reportApi";

/**
 * ReportHistory — table of past security reports with view, download,
 * and delete actions. Fetches data internally.
 */
export default function ReportHistory() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReportHistory(limit);
      setReports(res.data?.reports || res.data || []);
    } catch (err) {
      console.error("Failed to load report history:", err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (reportId) => {
    setDeletingId(reportId);
    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.report_id !== reportId));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const scoreColor = (score) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const riskBadge = (level) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";
    switch (level) {
      case "Critical":
        return `${base} bg-red-500/20 text-red-400 border border-red-500/30`;
      case "High":
        return `${base} bg-orange-500/20 text-orange-400 border border-orange-500/30`;
      case "Medium":
        return `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case "Low":
        return `${base} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`;
      default:
        return `${base} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ── Skeleton row ─────────────────────────────────────────────────────────
  const SkeletonRow = () => (
    <tr className="border-b border-gray-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Report History</h3>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Show</label>
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="appearance-none bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Report ID</th>
              <th className="px-4 py-3 font-medium">Repository</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Risk Level</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="w-10 h-10 text-gray-600" />
                    <p className="text-gray-500 text-sm">No reports found. Generate your first report above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {reports.map((r, idx) => (
                  <motion.tr
                    key={r.report_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-400">
                        {r.report_id?.slice(0, 12) || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-200">
                      {r.repository?.name || r.repo_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${scoreColor(r.security_score)}`}>
                        {r.security_score ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={riskBadge(r.risk_level)}>{r.risk_level || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDate(r.created_at || r.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <button
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            navigate(`/security-report?report=${r.report_id}`);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        {confirmDelete === r.report_id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(r.report_id)}
                              disabled={deletingId === r.report_id}
                              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
                            >
                              {deletingId === r.report_id ? (
                                <Loader2 className="w-3 h-3 animate-spin inline" />
                              ) : (
                                "Confirm"
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(r.report_id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && reports.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
          Showing {reports.length} report{reports.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
