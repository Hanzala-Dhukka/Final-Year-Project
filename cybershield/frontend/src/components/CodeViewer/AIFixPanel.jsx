import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { explainFinding } from "../../api/vulnerabilityAiApi";

/**
 * AIFixPanel — AI explanation and suggested fix panel for a single finding.
 *
 * Props:
 *   finding  – the selected finding object (or null)
 *   scanId   – current scan ID for context
 */

const SEVERITY_STYLES = {
  Critical: "bg-red-500/15 text-red-400 border-red-500/30",
  High: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Low: "bg-green-500/15 text-green-400 border-green-500/30",
};

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 px-4 py-8 text-center justify-center">
      <Loader2 size={18} className="text-blue-400 animate-spin" />
      <span className="text-sm text-gray-400">Analyzing vulnerability with AI...</span>
    </div>
  );
}

function CodeBlock({ code, variant }) {
  if (!code) return null;
  const isVulnerable = variant === "vulnerable";
  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        isVulnerable
          ? "bg-red-500/5 border-red-500/20"
          : "bg-green-500/5 border-green-500/20"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium border-b ${
          isVulnerable
            ? "text-red-400 bg-red-500/10 border-red-500/20"
            : "text-green-400 bg-green-500/10 border-green-500/20"
        }`}
      >
        <span>{isVulnerable ? "❌" : "✅"}</span>
        {isVulnerable ? "Vulnerable Code" : "Secure Code"}
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-5 font-mono text-gray-300">
        {code}
      </pre>
    </div>
  );
}

export default function AIFixPanel({ finding, scanId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch AI analysis when finding changes
  useEffect(() => {
    if (!finding) {
      setAnalysis(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      setAnalysis(null);

      try {
        const result = await explainFinding({
          type: finding.rule_name,
          severity: finding.severity,
          file: finding.file,
          code: finding.code,
          finding_id: finding._id || `${finding.file}-${finding.line}`,
        });
        if (!cancelled) {
          setAnalysis(result.analysis);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.detail || err.message || "Failed to get AI analysis");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [finding]);

  const handleCopy = useCallback(() => {
    const secureCode = analysis?.secure_code || finding?.suggestion;
    if (secureCode) {
      navigator.clipboard.writeText(secureCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [analysis, finding]);

  // Empty state
  if (!finding) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-4">
          <Sparkles size={22} className="text-gray-600" />
        </div>
        <p className="text-sm text-gray-500 max-w-[220px]">
          Select a vulnerability to view AI analysis
        </p>
      </div>
    );
  }

  const severity = finding.severity || "Medium";
  const secureCode = analysis?.secure_code || finding?.suggestion || null;

  return (
    <div className="flex flex-col h-full">
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between w-full px-4 py-2.5 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-white">AI Analysis</span>
          {loading && (
            <Loader2 size={12} className="text-blue-400 animate-spin" />
          )}
        </div>
        {collapsed ? (
          <ChevronDown size={14} className="text-gray-500" />
        ) : (
          <ChevronUp size={14} className="text-gray-500" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              {/* Finding summary */}
              <div className="space-y-2">
                {/* Severity badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    SEVERITY_STYLES[severity] || SEVERITY_STYLES.Medium
                  }`}
                >
                  <AlertTriangle size={12} />
                  {severity}
                </span>

                {/* Rule info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rule:</span>
                    <span className="text-xs text-blue-400 font-mono">
                      {finding.rule_id || finding.rule_name || finding.type || "—"}
                    </span>
                  </div>
                  {finding.confidence != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${finding.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{finding.confidence}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {finding.message && (
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                    {finding.message}
                  </p>
                )}

                {/* File:Line */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield size={12} />
                  <span className="font-mono truncate">
                    {finding.file}:{finding.line}
                  </span>
                </div>
              </div>

              {/* Loading state */}
              {loading && <LoadingSpinner />}

              {/* Error state */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Analysis content */}
              {analysis && !loading && (
                <div className="space-y-4">
                  {/* Summary */}
                  {analysis.summary && (
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                        Summary
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Technical explanation */}
                  {analysis.technical_explanation && (
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                        Technical Explanation
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {analysis.technical_explanation}
                      </p>
                    </div>
                  )}

                  {/* Attack scenario */}
                  {analysis.attack_scenario && (
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                        Attack Scenario
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                        {analysis.attack_scenario}
                      </p>
                    </div>
                  )}

                  {/* Remediation steps */}
                  {analysis.remediation && (
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                        Remediation Steps
                      </h4>
                      <ol className="space-y-1.5">
                        {(Array.isArray(analysis.remediation)
                          ? analysis.remediation
                          : analysis.remediation.split(/\n|\d+\.\s+/).filter(Boolean)
                        ).map((step, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-gray-300"
                          >
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{step.trim()}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Suggested Fix section */}
                  {(finding.code || secureCode) && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Suggested Fix
                      </h4>

                      {/* Vulnerable code */}
                      {finding.code && <CodeBlock code={finding.code} variant="vulnerable" />}

                      {/* Secure code */}
                      {secureCode && (
                        <>
                          <CodeBlock code={secureCode} variant="secure" />
                          <button
                            onClick={handleCopy}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              copied
                                ? "bg-green-500/15 border-green-500/30 text-green-400"
                                : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            {copied ? (
                              <>
                                <Check size={12} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                Copy Secure Code
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
