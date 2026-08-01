import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompareArrows,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from "lucide-react";
import { getReportHistory, compareScans } from "../../api/reportApi";

/**
 * CompareScans — side-by-side comparison of two security scans.
 *
 * Props:
 *   scanIds {string[]|undefined} — optional pre-populated scan ID list.
 *                                  If omitted, loads from report history.
 */
export default function CompareScans({ scanIds: propScanIds }) {
  const [scanOptions, setScanOptions] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [previousId, setPreviousId] = useState("");
  const [currentId, setCurrentId] = useState("");
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ── Load scan list ───────────────────────────────────────────────────────
  const loadScans = useCallback(async () => {
    if (propScanIds && propScanIds.length > 0) {
      setScanOptions(propScanIds);
      setLoadingScans(false);
      return;
    }
    setLoadingScans(true);
    try {
      const res = await getReportHistory(50);
      const reports = res.data?.reports || res.data || [];
      setScanOptions(reports.map((r) => ({ id: r.report_id, label: `${r.repository?.name || r.repo_name || "Unknown"} — ${r.security_score ?? "—"}` })));
    } catch (err) {
      console.error("Failed to load scan options:", err);
    } finally {
      setLoadingScans(false);
    }
  }, [propScanIds]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  // ── Compare handler ──────────────────────────────────────────────────────
  const handleCompare = async () => {
    if (!previousId || !currentId) return;
    setComparing(true);
    setError(null);
    setResult(null);
    try {
      const res = await compareScans(previousId, currentId);
      setResult(res.data);
    } catch (err) {
      console.error("Compare failed:", err);
      setError("Failed to compare scans. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isPropArray = Array.isArray(propScanIds) && propScanIds.length > 0;

  const renderSelect = (value, onChange, placeholder) => (
    <div className="relative flex-1 min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loadingScans}
        className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer"
      >
        <option value="">{loadingScans ? "Loading..." : placeholder}</option>
        {scanOptions.map((opt) => {
          const id = typeof opt === "string" ? opt : opt.id;
          const label = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={id} value={id}>
              {label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );

  // ── Metric comparison rows ──────────────────────────────────────────────
  const metrics = result?.comparison || [
    { metric: "Score", previous: result?.previous?.security_score, current: result?.current?.security_score, higherIsBetter: true },
    { metric: "Critical", previous: result?.previous?.critical, current: result?.current?.critical, higherIsBetter: false },
    { metric: "High", previous: result?.previous?.high, current: result?.current?.high, higherIsBetter: false },
    { metric: "Medium", previous: result?.previous?.medium, current: result?.current?.medium, higherIsBetter: false },
    { metric: "Low", previous: result?.previous?.low, current: result?.current?.low, higherIsBetter: false },
  ];

  const getChangeColor = (prev, curr, higherIsBetter) => {
    const diff = curr - prev;
    if (diff === 0) return "text-gray-400";
    const improved = higherIsBetter ? diff > 0 : diff < 0;
    return improved ? "text-emerald-400" : "text-red-400";
  };

  const getChangeIcon = (prev, curr, higherIsBetter) => {
    const diff = curr - prev;
    if (diff === 0) return <Minus className="w-3.5 h-3.5" />;
    const improved = higherIsBetter ? diff > 0 : diff < 0;
    return improved ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />;
  };

  // ── Summary message ─────────────────────────────────────────────────────
  const scoreDiff = (result?.current?.security_score ?? 0) - (result?.previous?.security_score ?? 0);
  const summaryMessage = result
    ? scoreDiff > 0
      ? `Security score improved by ${Math.abs(scoreDiff)}%`
      : scoreDiff < 0
        ? `Security score decreased by ${Math.abs(scoreDiff)}%`
        : "Security score remained the same"
    : null;

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
        <GitCompareArrows className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Compare Scans</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Selectors */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {renderSelect(previousId, setPreviousId, "Previous Scan")}
          <span className="hidden sm:flex items-center text-gray-500 text-sm font-medium">vs</span>
          {renderSelect(currentId, setCurrentId, "Current Scan")}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCompare}
            disabled={!previousId || !currentId || comparing}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            {comparing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitCompareArrows className="w-4 h-4" />
            )}
            <span>{comparing ? "Comparing..." : "Compare"}</span>
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Comparison Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium">Metric</th>
                      <th className="px-4 py-3 font-medium">Previous</th>
                      <th className="px-4 py-3 font-medium">Current</th>
                      <th className="px-4 py-3 font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m, idx) => {
                      const prev = m.previous ?? "—";
                      const curr = m.current ?? "—";
                      const diff = typeof prev === "number" && typeof curr === "number" ? curr - prev : 0;
                      const color = getChangeColor(prev, curr, m.higherIsBetter);
                      return (
                        <motion.tr
                          key={m.metric}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className="border-b border-gray-800/60 last:border-0"
                        >
                          <td className="px-4 py-3 text-gray-200 font-medium">{m.metric}</td>
                          <td className="px-4 py-3 text-gray-300">{prev}</td>
                          <td className="px-4 py-3 text-white font-semibold">{curr}</td>
                          <td className={`px-4 py-3 font-semibold ${color}`}>
                            <span className="inline-flex items-center gap-1">
                              {getChangeIcon(prev, curr, m.higherIsBetter)}
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`rounded-lg px-4 py-3 text-sm font-medium border ${
                  scoreDiff > 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : scoreDiff < 0
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  {scoreDiff > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : scoreDiff < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                  {summaryMessage}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
