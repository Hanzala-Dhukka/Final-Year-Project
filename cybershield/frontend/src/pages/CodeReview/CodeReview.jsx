import { useState, useEffect } from "react";
import codeReviewApi from "../../api/codeReviewApi";
import CodeEditor from "../../components/CodeReview/CodeEditor";
import UploadBox from "../../components/CodeReview/UploadBox";
import ReviewResult from "../../components/CodeReview/ReviewResult";
import SeverityBadge from "../../components/CodeReview/SeverityBadge";

/**
 * AI Code Review page (Module 5.3).
 * Left: paste/upload code + review history. Right: analysis results.
 */
export default function CodeReview() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("paste"); // paste | upload

  const loadHistory = async () => {
    try {
      const res = await codeReviewApi.getHistory();
      setHistory(res.data || []);
    } catch (e) {
      console.error("Failed to load review history", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError("Please paste some code to review.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await codeReviewApi.reviewCode(code, language || null);
      setResult(res.data);
      await loadHistory();
    } catch (e) {
      setError(e.response?.data?.detail || "Review failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file) => {
    setLoading(true);
    setError("");
    try {
      const res = await codeReviewApi.reviewFile(file, language || null);
      setResult(res.data);
      // Show the reviewed code in the editor too
      try {
        const text = await file.text();
        setCode(text);
      } catch (_) { /* ignore */ }
      await loadHistory();
    } catch (e) {
      setError(e.response?.data?.detail || "Review failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (id) => {
    try {
      const res = await codeReviewApi.getReport(id);
      setResult(res.data);
    } catch (e) {
      console.error("Failed to open report", e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await codeReviewApi.deleteReview(id);
      if (result && result.review_id === id) setResult(null);
      await loadHistory();
    } catch (e) {
      console.error("Failed to delete review", e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Left panel: input + history */}
      <aside className="w-96 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow p-4">
          <h1 className="text-xl font-bold text-gray-800 mb-3">🛡️ AI Code Review</h1>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab("paste")}
              className={`flex-1 px-3 py-1.5 rounded text-sm ${activeTab === "paste" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Paste Code
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 px-3 py-1.5 rounded text-sm ${activeTab === "upload" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Upload File
            </button>
          </div>

          {activeTab === "paste" ? (
            <CodeEditor
              code={code}
              onCodeChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              disabled={loading}
            />
          ) : (
            <UploadBox onFile={handleFile} disabled={loading} />
          )}

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <button
            onClick={analyzeCode}
            disabled={loading || (activeTab === "paste" && !code.trim())}
            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {/* History */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-2">Review History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between border border-gray-200 rounded p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => openHistory(h.id)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {h.language} Review
                    </p>
                    <p className="text-xs text-gray-400">
                      Risk {h.risk_score} · {h.created_at?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge
                      severity={
                        (h.severity_summary?.Critical > 0 && "Critical") ||
                        (h.severity_summary?.High > 0 && "High") ||
                        (h.severity_summary?.Medium > 0 && "Medium") || "Low"
                      }
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Right panel: results */}
      <main className="flex-1 overflow-y-auto">
        <ReviewResult result={result} loading={loading} />
      </main>
    </div>
  );
}
