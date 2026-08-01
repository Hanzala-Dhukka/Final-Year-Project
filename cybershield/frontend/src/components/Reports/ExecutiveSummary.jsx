import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  GitBranch,
  Sparkles,
} from "lucide-react";

const getScoreColor = (score) => {
  if (score >= 85) return { ring: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", text: "text-green-400", label: "Excellent" };
  if (score >= 65) return { ring: "#eab308", bg: "rgba(234, 179, 8, 0.15)", text: "text-yellow-400", label: "Good" };
  if (score >= 40) return { ring: "#f97316", bg: "rgba(249, 115, 22, 0.15)", text: "text-orange-400", label: "Fair" };
  return { ring: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", text: "text-red-400", label: "Poor" };
};

const getRiskBadge = (level) => {
  switch (level?.toUpperCase()) {
    case "LOW":
      return { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30", dot: "bg-green-400" };
    case "MEDIUM":
      return { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-400" };
    case "HIGH":
      return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-400" };
    case "CRITICAL":
      return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-400" };
    default:
      return { bg: "bg-gray-500/15", text: "text-gray-400", border: "border-gray-500/30", dot: "bg-gray-400" };
  }
};

const severityConfig = [
  { key: "critical", label: "Critical", color: "text-red-400", bg: "bg-red-500/15", icon: AlertCircle },
  { key: "high", label: "High", color: "text-orange-400", bg: "bg-orange-500/15", icon: AlertTriangle },
  { key: "medium", label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/15", icon: AlertTriangle },
  { key: "low", label: "Low", color: "text-green-400", bg: "bg-green-500/15", icon: Info },
];

function ScoreCircle({ score }) {
  const { ring, bg, text, label } = getScoreColor(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className={`text-3xl font-bold ${text}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

export default function ExecutiveSummary({ report }) {
  if (!report) return null;

  const score = report.security_score ?? report.score ?? 0;
  const riskLevel = report.risk_level ?? "MEDIUM";
  const riskBadge = getRiskBadge(riskLevel);
  const severityCounts = report.severity_counts ?? report.vulnerability_summary ?? {};
  const totalFindings =
    report.total_findings ??
    Object.values(severityCounts).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  const aiSummary = report.ai_executive_summary ?? report.ai_summary ?? null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-transparent px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Security Report</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            {report.repository ?? report.repo_name ?? "Unknown Repository"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(report.generated_at ?? report.created_at ?? report.scan_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            ID: {(report.id ?? report.report_id ?? "").slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Score & Risk Row */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          {/* Score Circle */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <ScoreCircle score={score} />
          </motion.div>

          {/* Risk Badge + Summary Stats */}
          <div className="flex-1 w-full">
            {/* Risk Level Badge */}
            <div className="mb-5">
              <span className="text-xs text-gray-500 uppercase tracking-wider mr-2">Risk Level</span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${riskBadge.dot}`} />
                {riskLevel}
              </span>
            </div>

            {/* Severity Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {severityConfig.map(({ key, label, color, bg, icon: Icon }, i) => (
                <motion.div
                  key={key}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${bg} border border-white/5`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  <div>
                    <span className={`text-lg font-bold ${color}`}>
                      {severityCounts[key] ?? 0}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1.5">{label}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Total Findings */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-400">Total Findings:</span>
              <span className="text-white font-semibold">{totalFindings}</span>
            </div>
          </div>
        </div>

        {/* AI Executive Summary */}
        {aiSummary && (
          <motion.div
            className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">AI Executive Summary</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{aiSummary}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
