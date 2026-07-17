import { useState, useEffect } from "react";
import copilotApi from "../../api/copilotApi";
import SecurityScore from "../../components/Copilot/SecurityScore";
import RiskCard from "../../components/Copilot/RiskCard";
import RecommendationCard from "../../components/Copilot/RecommendationCard";
import Roadmap from "../../components/Copilot/Roadmap";
import FindingPriority from "../../components/Copilot/FindingPriority";

/**
 * AI Security Copilot page (Module 5.5).
 *
 * Combines GitHub scan, threat model, OWASP, code review and remediation data
 * into a single security advisory with score, prioritised findings, AI
 * recommendations and a roadmap. Supports natural-language commands (Step 11).
 */
const QUICK_COMMANDS = [
  "Analyze my project security posture.",
  "Explain my biggest risk.",
  "Generate a security roadmap.",
  "How can I improve my score?",
  "What should I fix first?",
  "Explain my vulnerabilities.",
  "Prepare a security report.",
];

export default function SecurityCopilot() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const res = await copilotApi.history();
      setHistory(res.data || []);
    } catch (e) {
      console.error("Failed to load advisory history", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Build prioritised findings from the advisory's raw context.
  const buildPriority = (raw) => {
    if (!raw) return [];
    const list = [];
    const scan = raw.github_scan;
    if (scan?.vulnerabilities) {
      scan.vulnerabilities.forEach((v) =>
        list.push({ title: v.type, severity: v.severity })
      );
    }
    const cr = raw.code_review;
    if (cr) {
      ["critical", "high", "medium", "low"].forEach((sev) => {
        for (let i = 0; i < (cr[sev] || 0); i++) {
          list.push({ title: `Code review ${sev} issue`, severity: sev[0].toUpperCase() + sev.slice(1) });
        }
      });
    }
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return list.sort((a, b) => order[a.severity] - order[b.severity]);
  };

  const runAnalysis = async (question = null) => {
    setLoading(true);
    setError("");
    try {
      const res = await copilotApi.analyze(null, question);
      setReport(res.data);
      await loadHistory();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to generate assessment.");
    } finally {
      setLoading(false);
    }
  };

  const openAdvisory = async (id) => {
    try {
      const res = await copilotApi.getReport(id);
      setReport(res.data);
    } catch (e) {
      setError("Failed to open advisory.");
    }
  };

  const priorityFindings = buildPriority(report?.raw_context);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🛡️ CyberShield Security Copilot</h1>
        <button
          onClick={() => runAnalysis()}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze Project"}
        </button>
      </div>

      {/* Quick commands (Step 11) */}
      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((c) => (
          <button
            key={c}
            onClick={() => runAnalysis(c)}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!report && !loading && (
        <p className="text-gray-400">
          Run an analysis to generate a complete security advisory. The copilot
          combines your GitHub scans, threat models, OWASP labs, code reviews
          and remediation status.
        </p>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Score + risk */}
          <section className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Overview</h2>
            <SecurityScore score={report.security_score} risk={report.risk_level} />
            <p className="text-sm text-gray-600 mt-4">{report.summary}</p>
          </section>

          {/* Critical issues */}
          <section className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Critical Issues</h2>
            <FindingPriority findings={priorityFindings} />
            {report.critical_findings?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">AI-flagged:</p>
                {report.critical_findings.map((f, i) => (
                  <RiskCard key={i} title={f} severity="Critical" />
                ))}
              </div>
            )}
          </section>

          {/* Recommendations */}
          <section className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-3">AI Recommendations</h2>
            <div className="space-y-2">
              {report.recommendations?.length ? (
                report.recommendations.map((r, i) => (
                  <RecommendationCard key={i} index={i} text={r} />
                ))
              ) : (
                <p className="text-sm text-gray-400">No recommendations yet.</p>
              )}
            </div>
          </section>

          {/* Roadmap */}
          <section className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Security Roadmap</h2>
            <Roadmap weeks={report.roadmap} />
          </section>
        </div>
      )}

      {/* History */}
      <section className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-2">Previous Advisories</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No advisories yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                onClick={() => openAdvisory(h.id)}
                className="flex items-center justify-between border border-gray-200 rounded p-2 cursor-pointer hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{h.project || "General"}</p>
                  <p className="text-xs text-gray-400">
                    Score {h.security_score} · {h.created_at?.slice(0, 10)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-600">{h.risk_level}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
