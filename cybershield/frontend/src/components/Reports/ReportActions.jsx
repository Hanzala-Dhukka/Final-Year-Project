import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Mail,
  Sparkles,
  Check,
  Loader2,
  Share2,
  Send,
} from "lucide-react";
import {
  downloadPdf,
  downloadJson,
  downloadCsv,
  emailReport,
  getAiSummary,
} from "../../api/reportApi";

/**
 * ReportActions — action buttons for downloading, sharing, and generating
 * an AI summary of a security report.
 *
 * Props:
 *   reportId  {string}  — the report's unique ID
 *   report    {object}  — the full report object (used for filename hints)
 */
export default function ReportActions({ reportId, report }) {
  const [loading, setLoading] = useState(null); // key of the in-flight action
  const [success, setSuccess] = useState(null); // key of the recently completed action
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiError, setAiError] = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const flashSuccess = (key) => {
    setSuccess(key);
    setTimeout(() => setSuccess(null), 2000);
  };

  const triggerDownload = (response, filename) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const repoName = report?.repository?.name || report?.repo_name || "report";
  const shortId = reportId?.slice(0, 8) || "unknown";

  // ── Download handlers ──────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    setLoading("pdf");
    try {
      const res = await downloadPdf(reportId);
      triggerDownload(res, `${repoName}_${shortId}.pdf`);
      flashSuccess("pdf");
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadJson = async () => {
    setLoading("json");
    try {
      const res = await downloadJson(reportId);
      triggerDownload(res, `${repoName}_${shortId}.json`);
      flashSuccess("json");
    } catch (err) {
      console.error("JSON download failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadCsv = async () => {
    setLoading("csv");
    try {
      const res = await downloadCsv(reportId);
      triggerDownload(res, `${repoName}_${shortId}.csv`);
      flashSuccess("csv");
    } catch (err) {
      console.error("CSV download failed:", err);
    } finally {
      setLoading(null);
    }
  };

  // ── Email handler ──────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setEmailSending(true);
    try {
      await emailReport(reportId, email.trim());
      setEmailDone(true);
      setTimeout(() => {
        setEmailDone(false);
        setEmailOpen(false);
        setEmail("");
      }, 2000);
    } catch (err) {
      console.error("Email send failed:", err);
    } finally {
      setEmailSending(false);
    }
  };

  // ── AI Summary handler ─────────────────────────────────────────────────────
  const handleAiSummary = async () => {
    setLoading("ai");
    setAiError(null);
    try {
      const res = await getAiSummary(reportId);
      setAiSummary(res.data?.summary || res.data);
      flashSuccess("ai");
    } catch (err) {
      console.error("AI summary failed:", err);
      setAiError("Failed to generate AI summary.");
    } finally {
      setLoading(null);
    }
  };

  // ── Shared button wrapper ──────────────────────────────────────────────────
  const ActionButton = ({ icon: Icon, label, onClick, actionKey, accent }) => {
    const isLoading = loading === actionKey;
    const isSuccess = success === actionKey;
    return (
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        disabled={loading !== null}
        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${
            accent
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600"
          }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.span
              key="spinner"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.span>
          ) : isSuccess ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Check className="w-4 h-4 text-emerald-400" />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Icon className="w-4 h-4" />
            </motion.span>
          )}
        </AnimatePresence>
        <span>{isLoading ? "Working..." : isSuccess ? "Done!" : label}</span>
      </motion.button>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Action Buttons Row ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton
          icon={Download}
          label="Download PDF"
          onClick={handleDownloadPdf}
          actionKey="pdf"
        />
        <ActionButton
          icon={FileJson}
          label="Download JSON"
          onClick={handleDownloadJson}
          actionKey="json"
        />
        <ActionButton
          icon={FileSpreadsheet}
          label="Download CSV"
          onClick={handleDownloadCsv}
          actionKey="csv"
        />

        {/* Email button toggles the inline form */}
        <div className="relative">
          <ActionButton
            icon={Mail}
            label="Email Report"
            onClick={() => setEmailOpen((prev) => !prev)}
            actionKey="email"
          />
        </div>

        <ActionButton
          icon={Sparkles}
          label="Generate AI Summary"
          onClick={handleAiSummary}
          actionKey="ai"
          accent
        />
      </div>

      {/* ── Inline Email Form ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {emailOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
              <Mail className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendEmail}
                disabled={emailSending || !email.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
              >
                {emailSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : emailDone ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{emailSending ? "Sending..." : emailDone ? "Sent!" : "Send"}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Summary Result ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {(aiSummary || aiError) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-lg p-4 border ${
              aiError
                ? "bg-red-900/20 border-red-800 text-red-300"
                : "bg-gray-800/60 border-gray-700 text-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">AI Executive Summary</span>
            </div>
            {aiError ? (
              <p className="text-sm">{aiError}</p>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{typeof aiSummary === "string" ? aiSummary : JSON.stringify(aiSummary, null, 2)}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
