import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import remediationApi from "../../api/remediationApi";
import VulnerabilityCard from "../../components/AIRecommendations/VulnerabilityCard";
import StatusBadge from "../../components/AIRecommendations/StatusBadge";

/**
 * AI Security Recommendations page (Module 5.4).
 *
 * - Lists saved remediations for the user's projects.
 * - Lets the user generate a new fix from a pasted finding.
 * - Supports an inbound "Explain Fix" deep link from the GitHub Scanner /
 *   Threat Report / Code Review via query params (?finding=&code=&severity=...).
 */
export default function AIRecommendations() {
  const [searchParams] = useSearchParams();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Manual generation form
  const [finding, setFinding] = useState("");
  const [severity, setSeverity] = useState("High");
  const [technology, setTechnology] = useState("");
  const [code, setCode] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      // The backend lists per-project; aggregate across the user's projects.
      // We call the per-project endpoint for each known project id, or fall
      // back to a single "" project bucket used by manual generation.
      const res = await remediationApi.listByProject("");
      setRecommendations(res.data || []);
    } catch (e) {
      console.error("Failed to load recommendations", e);
      setError(e.response?.data?.detail || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Inbound "Explain Fix" deep link (scanner / threat report / code review)
  useEffect(() => {
    const qFinding = searchParams.get("finding");
    if (qFinding) {
      setFinding(qFinding);
      setSeverity(searchParams.get("severity") || "High");
      setTechnology(searchParams.get("technology") || "");
      setCode(searchParams.get("code") || "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);

  const generate = async () => {
    if (!finding.trim()) {
      setError("Please describe the vulnerability to remediate.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      await remediationApi.generate({
        finding: finding.trim(),
        severity,
        technology: technology.trim() || undefined,
        code: code.trim() || undefined,
        source: searchParams.get("source") || "manual",
      });
      setFinding("");
      setCode("");
      await loadAll();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to generate remediation.");
    } finally {
      setGenerating(false);
    }
  };

  const markFixed = async (id) => {
    try {
      await remediationApi.markFixed(id);
      await loadAll();
    } catch (e) {
      console.error("Failed to mark fixed", e);
    }
  };

  const visible = recommendations.filter(
    (r) => statusFilter === "All" || r.status === statusFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🛡️ AI Security Recommendations</h1>
        <div className="flex gap-2">
          {["All", "Open", "In Progress", "Fixed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded ${
                statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Generate panel */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-3">
          Generate a Fix {searchParams.get("finding") ? "(from scanner finding)" : ""}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Vulnerability (e.g. SQL Injection)"
            value={finding}
            onChange={(e) => setFinding(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            {["Critical", "High", "Medium", "Low"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Technology (e.g. FastAPI)"
            value={technology}
            onChange={(e) => setTechnology(e.target.value)}
          />
        </div>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          rows={4}
          placeholder="Paste the vulnerable code snippet (optional)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <button
          onClick={generate}
          disabled={generating}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate Fix"}
        </button>
      </div>

      {/* Recommendations list */}
      <div>
        {loading ? (
          <p className="text-gray-400">Loading recommendations…</p>
        ) : visible.length === 0 ? (
          <p className="text-gray-400">No recommendations yet.</p>
        ) : (
          visible.map((r) => (
            <VulnerabilityCard
              key={r.id}
              report={r}
              onMarkFixed={markFixed}
            />
          ))
        )}
      </div>
    </div>
  );
}
