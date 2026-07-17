import VulnerabilityCard from "./VulnerabilityCard";
import AIExplanation from "./AIExplanation";
import CodeDiff from "./CodeDiff";
import { codeReviewApi } from "../../api/codeReviewApi";

/**
 * Displays a completed code review: score, findings, AI explanation, secure code,
 * OWASP/CWE mappings, and export buttons (JSON / Markdown / PDF).
 */
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function ReviewResult({ result, loading }) {
  if (loading) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p className="text-lg">🔍 Analyzing code…</p>
      </div>
    );
  }
  if (!result) return null;

  const onExport = async (format) => {
    try {
      const res = await codeReviewApi.exportReview(result.review_id, format);
      if (format === "json") {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        downloadBlob(blob, `code_review_${result.review_id}.json`);
      } else {
        downloadBlob(res.data, `code_review_${result.review_id}.${format}`);
      }
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const summary = result.severity_summary || {};

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-gray-500">Risk Score</p>
          <p className="text-3xl font-bold text-red-600">{result.risk_score}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Language</p>
          <p className="font-semibold">{result.language}</p>
        </div>
        <div className="flex gap-3 text-sm">
          {["Critical", "High", "Medium", "Low"].map((s) => (
            <span key={s} className="text-gray-700">
              {s}: <b>{summary[s] || 0}</b>
            </span>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => onExport("json")} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">JSON</button>
          <button onClick={() => onExport("markdown")} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">Markdown</button>
          <button onClick={() => onExport("pdf")} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">PDF</button>
        </div>
      </div>

      {/* OWASP / CWE mappings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-600">OWASP:</span>
          {(result.owasp || []).map((o) => (
            <span key={o} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{o}</span>
          )) || <span className="text-sm text-gray-400">None</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-semibold text-gray-600">CWE:</span>
          {(result.cwe || []).map((c) => (
            <span key={c} className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs">{c}</span>
          )) || <span className="text-sm text-gray-400">None</span>}
        </div>
      </div>

      {/* Findings */}
      <div>
        <h3 className="font-bold text-gray-800 mb-2">Vulnerabilities</h3>
        {(result.findings || []).length === 0 ? (
          <p className="text-green-600 text-sm">✅ No known vulnerability patterns detected by the static scanner.</p>
        ) : (
          <div className="space-y-2">
            {result.findings.map((f, i) => (
              <VulnerabilityCard key={i} finding={f} />
            ))}
          </div>
        )}
      </div>

      {/* AI explanation */}
      <AIExplanation text={result.ai_explanation} />

      {/* Secure code */}
      <CodeDiff code={result.secure_code} language={result.language} />
    </div>
  );
}
