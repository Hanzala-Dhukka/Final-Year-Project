import { useState, useRef } from "react"
import BeforeScan from "./BeforeScan"
import Scanning from "./Scanning"
import ScanResults from "./ScanResults"
import ScanError from "./ScanError"
import { githubStartScan, githubGetResults } from "../../services/scanService"
import "../SecurityScanner/GitHubScanner.css"

/**
 * State machine:
 *   idle → scanning → completed
 *                   → error
 */
export default function GithubScanner() {
  const [scanState, setScanState] = useState("idle") // "idle" | "scanning" | "completed" | "error"
  const [scanResult, setScanResult] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [repoUrl, setRepoUrl] = useState("")
  const [scanId, setScanId] = useState(null)
  const [error, setError] = useState(null)
  const scanIdRef = useRef(null)

  /* ── Start scan ───────────────────────────────────────── */
  const startScan = async (url) => {
    try {
      setRepoUrl(url)
      setIsScanning(true)
      setScanState("scanning")
      setError(null)

      const response = await githubStartScan(url)
      setScanId(response.scan_id)
      scanIdRef.current = response.scan_id
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || err.message || "Failed to start scan"
      if (status === 409) {
        setError("A scan is already running for this repository. Please wait or refresh.")
      } else {
        setError(detail)
      }
      setScanState("error")
      setIsScanning(false)
    }
  }

  /* ── Scan completed via WebSocket ─────────────────────── */
  const handleScanComplete = async (data) => {
    try {
      const sid = data?.scan_id || scanId || scanIdRef.current
      if (sid) {
        const raw = await githubGetResults(sid)
        setScanResult(mapScanResult(raw))
        setScanState("completed")
      } else {
        setError("Scan completed but no scan ID found.")
        setScanState("error")
      }
    } catch (err) {
      console.error("Failed to fetch scan results:", err)
      setError(err.message || "Failed to fetch scan results.")
      setScanState("error")
    } finally {
      setIsScanning(false)
    }
  }

  /* ── Reset to idle ────────────────────────────────────── */
  const handleRescan = () => {
    setScanState("idle")
    setScanResult(null)
    setRepoUrl("")
    setScanId(null)
    setError(null)
    setIsScanning(false)
    scanIdRef.current = null
  }

  /* ── Retry from error ─────────────────────────────────── */
  const handleRetry = () => {
    setScanState("idle")
    setError(null)
  }

  /* ── Render by state ──────────────────────────────────── */
  return (
    <>
      {scanState === "idle" && (
        <BeforeScan onStartScan={startScan} />
      )}

      {scanState === "scanning" && (
        <Scanning
          repoUrl={repoUrl}
          scanId={scanId}
          onScanComplete={handleScanComplete}
        />
      )}

      {scanState === "completed" && (
        <ScanResults
          result={scanResult}
          repoUrl={repoUrl}
          onRescan={handleRescan}
        />
      )}

      {scanState === "error" && (
        <ScanError
          error={error}
          onRetry={handleRetry}
        />
      )}
    </>
  )
}

/* ── Derive language from file extension (frontend fallback) ── */
const EXT_LANG = {
  ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript",
  ".jsx": "JavaScript", ".java": "Java", ".go": "Go", ".rs": "Rust",
  ".rb": "Ruby", ".php": "PHP", ".c": "C", ".cpp": "C++", ".cs": "C#",
  ".h": "C/C++", ".hpp": "C++", ".swift": "Swift", ".kt": "Kotlin",
  ".sh": "Shell", ".bash": "Shell", ".yml": "YAML", ".yaml": "YAML",
  ".json": "JSON", ".xml": "XML", ".html": "HTML", ".css": "CSS",
  ".sql": "SQL", ".md": "Markdown", ".tf": "Terraform", ".vue": "Vue",
}

function detectLanguage(filePath) {
  if (!filePath) return ""
  const lower = filePath.toLowerCase()
  for (const [ext, lang] of Object.entries(EXT_LANG)) {
    if (lower.endsWith(ext)) return lang
  }
  if (lower.includes("dockerfile")) return "Docker"
  if (lower.includes("makefile")) return "Makefile"
  return ""
}

/* ── Map scanner endpoint response to the format the UI expects ── */
function mapScanResult(data) {
  const findings = data.findings || [];
  const fileReport = data.file_report || [];
  const dependencyFindings = data.dependency_findings || [];
  const dependencyReport = data.dependency_report || {};
  const scanSummary = data.scan_summary || {};
  const aiReport = data.ai_report || {};
  const repoInfo = data.repository_info || {};
  const technologies = data.technologies || {};

  // Map repository_info fields to what RepositoryHealth expects
  const mappedRepoInfo = {
    name: repoInfo.repository || repoInfo.name || "Repository",
    owner: repoInfo.owner || "Unknown",
    description: repoInfo.description || "",
    stars: repoInfo.stars || 0,
    forks: repoInfo.forks || 0,
    issues: repoInfo.open_issues || 0,
    language: repoInfo.language || "Unknown",
    visibility: repoInfo.visibility || "public",
    license: repoInfo.license || "No License",
    defaultBranch: repoInfo.default_branch || "master",
    createdAt: repoInfo.created_at || "",
    updatedAt: repoInfo.updated_at || "",
    lastCommit: repoInfo.last_commit || "",
    topics: repoInfo.topics || [],
  };

  // Severity cards
  const severitySummary = {
    critical: scanSummary.severity_counts?.Critical || 0,
    high: scanSummary.severity_counts?.High || 0,
    medium: scanSummary.severity_counts?.Medium || 0,
    low: scanSummary.severity_counts?.Low || 0,
  };

  // Top Risks (merge file + issue) — preserve full location data for code context
  const topRisks = fileReport.flatMap((file) =>
    (file.issues || []).map((issue) => ({
      title: issue.type,
      severity: issue.severity,
      file: file.file,
      language: issue.language || file.language || detectLanguage(file.file) || "",
      matches: issue.matches_found,
      line: issue.line,
      column: issue.column,
      snippet: issue.locations?.[0]?.snippet || "",
      locations: issue.locations || [],
      recommendation:
        issue.recommendation || "Review and remediate this issue",
    }))
  );

  // Secret Detection
  const secretKeywords = [
    "password",
    "secret",
    "token",
    "api",
    "credential",
    "key",
  ];

  const advancedSecrets = topRisks.filter((risk) =>
    secretKeywords.some((k) =>
      (risk.title || "").toLowerCase().includes(k)
    )
  );

  const secretSummary =
    advancedSecrets.length > 0
      ? {
          count: advancedSecrets.length,
        }
      : null;

  // Category Summary
  const categorySummary = {};

  findings.forEach((finding) => {
    categorySummary[finding.type] =
      (categorySummary[finding.type] || 0) +
      (finding.matches_found || 1);
  });

  // Security Score (calculated)
  let securityScore = 100;

  securityScore -= severitySummary.critical * 25;
  securityScore -= severitySummary.high * 15;
  securityScore -= severitySummary.medium * 8;
  securityScore -= severitySummary.low * 2;

  securityScore = Math.max(0, securityScore);

  // File-wise breakdown for reports
  const fileBreakdown = fileReport.map((file) => ({
    file: file.file,
    language: file.language || detectLanguage(file.file) || "",
    issueCount: (file.issues || []).length,
    issues: file.issues || [],
    criticalCount: (file.issues || []).filter(i => i.severity === "Critical").length,
    mediumCount: (file.issues || []).filter(i => i.severity === "Medium").length,
    highCount: (file.issues || []).filter(i => i.severity === "High").length,
    lowCount: (file.issues || []).filter(i => i.severity === "Low").length,
  }));

  return {
    ...data,

    repository_info: mappedRepoInfo,
    repository: repoInfo.repository || data.repository || "",

    technologies,

    dependency_report: {
      totalPackages: dependencyReport.total_packages || 0,
      outdated: dependencyReport.outdated || 0,
      risky: dependencyReport.risky || 0,
      unpinned: dependencyReport.unpinned || 0,
      filesScanned: dependencyReport.files_scanned || [],
    },

    dependency_findings: dependencyFindings,

    findings,

    file_report: fileReport,

    scan_summary: scanSummary,

    ai_report: aiReport,

    severity_summary: severitySummary,

    top_risks: topRisks,

    advanced_secrets: advancedSecrets,

    secret_summary: secretSummary,

    category_summary: categorySummary,

    recommendations:
      aiReport.recommendations ||
      scanSummary.recommendations ||
      [],

    executive_summary:
      aiReport.summary ||
      scanSummary.summary ||
      "",

    security_score: securityScore,

    risk_level:
      scanSummary.risk_level || "Unknown",

    risk_score: Math.max(0, 100 - securityScore),

    file_breakdown: fileBreakdown,
  };
}
