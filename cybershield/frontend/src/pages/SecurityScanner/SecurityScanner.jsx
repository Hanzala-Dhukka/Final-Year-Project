import { useState, useEffect, useCallback } from "react";
import ScanHeader from "../../components/Scanner/ScanHeader";
import RepositoryInput from "../../components/Scanner/RepositoryInput";
import RepositoryInfo from "../../components/Scanner/RepositoryInfo";
import RepositoryHeader from "../../components/GitHubScanner/RepositoryHeader/RepositoryHeader";
import BranchSelector from "../../components/Scanner/BranchSelector";
import ScanConfiguration from "../../components/Scanner/ScanConfiguration";
import RecentScans from "../../components/Scanner/RecentScans";
import ScanTemplates from "../../components/Scanner/ScanTemplates";
import LanguageCard from "../../components/Scanner/LanguageCard";
import RepositoryStats from "../../components/Scanner/RepositoryStats";
import DependencyCard from "../../components/Scanner/DependencyCard";
import FileTree from "../../components/Scanner/FileTree";
import LiveProgress from "../../components/Scanner/LiveProgress";
import ETAWidget from "../../components/Scanner/ETAWidget";
import ScanTimeline from "../../components/Scanner/ScanTimeline";
import ScanLogs from "../../components/Scanner/ScanLogs";
import ScanStatus from "../../components/Scanner/ScanStatus";
import CancelScanButton from "../../components/Scanner/CancelScanButton";
import ScanResults from "../../components/Scanner/ScanResults";
import { validateRepository, analyzeRepository, getAnalysisHistory } from "../../api/githubApi";
import {
  scannerStartScan,
  scannerCancelScan,
  scannerGetLogs,
  scannerGetTimeline,
  scannerGetResults,
  createScannerWebSocket,
} from "../../services/scanService";

import "./scanner.css";

export default function SecurityScanner() {
  // ── Validation & Analysis State ───────────────────────────────
  const [validating, setValidating] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // ── Scan State ────────────────────────────────────────────────
  const [scanActive, setScanActive] = useState(false);
  const [scanStatus, setScanStatus] = useState("idle"); // idle | queued | running | completed | failed | cancelled
  const [currentScanId, setCurrentScanId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [filesCompleted, setFilesCompleted] = useState(0);
  const [filesTotal, setFilesTotal] = useState(0);
  const [eta, setEta] = useState("");
  const [riskScore, setRiskScore] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [logs, setLogs] = useState([]);

  // ── Config State ──────────────────────────────────────────────
  const [scanConfig, setScanConfig] = useState({
    secret: true,
    dependency: true,
    owasp: true,
    ai: true,
  });

  // ── Scan Results (Module D4) ─────────────────────────────────
  const [scanResults, setScanResults] = useState(null);

  // ── Recent Scans ──────────────────────────────────────────────
  const [recentScans, setRecentScans] = useState([]);

  // ── WebSocket ─────────────────────────────────────────────────
  const [ws, setWs] = useState(null);

  useEffect(() => {
    return () => {
      if (ws) ws.close();
    };
  }, [ws]);

  // Load recent scans on mount
  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    try {
      const history = await getAnalysisHistory();
      setRecentScans(
        history.map((h) => ({
          repo: h.repository,
          branch: h.default_branch,
          status: "Completed",
          score: h.stars,
          date: h.created_at ? new Date(h.created_at).toLocaleDateString() : "--",
        }))
      );
    } catch {
      // Will use default data
    }
  };

  // ── Connect to Scanner WebSocket ──────────────────────────────
  const connectScannerWS = useCallback((scanId) => {
    const websocket = createScannerWebSocket(
      (data) => {
        // Handle different message types
        if (data.type === "scan_progress") {
          if (data.scan_id !== scanId) return;
          setProgress(data.progress || 0);
          setCurrentFile(data.current_file || "");
          setCurrentStage(data.current_stage || "");
          setFilesCompleted(data.files_completed || 0);
          setFilesTotal(data.files_total || 0);
          setEta(data.eta || "");

          if (data.status === "completed") {
            setScanStatus("completed");
            setScanActive(false);
            setProgress(100);
            loadRecentScans();
          } else if (data.status === "failed") {
            setScanStatus("failed");
            setScanActive(false);
          } else if (data.status === "cancelled") {
            setScanStatus("cancelled");
            setScanActive(false);
          } else {
            setScanStatus("running");
          }
        }

        if (data.type === "scan_timeline" && data.scan_id === scanId) {
          setTimeline((prev) => [
            ...prev,
            { event: data.event, status: data.status, timestamp: data.timestamp },
          ]);
        }

        if (data.type === "scan_log" && data.scan_id === scanId) {
          setLogs((prev) => [
            ...prev,
            { message: data.message, timestamp: data.timestamp },
          ]);
        }

        if (data.type === "scan_started" && data.scan_id === scanId) {
          setScanStatus("queued");
          setFilesTotal(data.files_total || 0);
        }

        if (data.type === "scan_cancelled" && data.scan_id === scanId) {
          setScanStatus("cancelled");
          setScanActive(false);
        }
      },
      (error) => console.error("Scanner WS error:", error),
      () => console.log("Scanner WS closed")
    );

    setWs(websocket);
    return websocket;
  }, []);

  // ── Validate Repository ───────────────────────────────────────
  const handleValidate = async (repoUrl) => {
    setValidating(true);
    setAnalysisError("");
    try {
      await validateRepository(repoUrl);
      setAnalyzing(true);
      setCurrentStage("Fetching repository metadata...");
      setProgress(10);

      const result = await analyzeRepository(repoUrl);
      setProgress(100);
      setCurrentStage("Analysis complete!");
      setAnalysis(result);
      setSelectedBranch(result.default_branch || "main");
    } catch (err) {
      console.error("Repository analysis failed:", err);
      const detail = err.response?.data?.detail || err.message || "Failed to analyze repository";
      setAnalysisError(detail);
    } finally {
      setValidating(false);
      setAnalyzing(false);
    }
  };

  // ── Start Scan ────────────────────────────────────────────────
  const handleScanStart = async ({ repo, branch }) => {
    setScanActive(true);
    setScanStatus("queued");
    setProgress(0);
    setTimeline([]);
    setLogs([]);
    setCurrentFile("");
    setCurrentStage("Queuing scan...");
    setRiskScore(0);
    setScanResults(null);

    try {
      // Connect WebSocket first
      const websocket = connectScannerWS("pending");

      const result = await scannerStartScan(repo, branch, scanConfig);
      const scanId = result.scan_id;
      setCurrentScanId(scanId);

      // Update files total
      setFilesTotal(result.files_total || 0);
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || err.message || "Failed to start scan";
      if (status === 409) {
        setScanStatus("failed");
        setScanActive(false);
        setCurrentStage("A scan is already running for this repository.");
      } else {
        setScanStatus("failed");
        setScanActive(false);
        setCurrentStage(detail);
      }
    }
  };

  // ── Cancel Scan ───────────────────────────────────────────────
  const handleCancelScan = async (scanId) => {
    try {
      await scannerCancelScan(scanId || currentScanId);
      setScanStatus("cancelled");
      setScanActive(false);
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  // ── Load logs/timeline/results when scan completes ─────────────
  useEffect(() => {
    if (currentScanId && (scanStatus === "completed" || scanStatus === "running")) {
      const loadMetadata = async () => {
        try {
          const [logsData, timelineData] = await Promise.all([
            scannerGetLogs(currentScanId),
            scannerGetTimeline(currentScanId),
          ]);
          if (logsData.logs) setLogs(logsData.logs);
          if (timelineData.timeline) setTimeline(timelineData.timeline);

          // Load scan results when completed (Module D4)
          if (scanStatus === "completed") {
            const resultsData = await scannerGetResults(currentScanId);
            setScanResults(resultsData);
          }
        } catch {
          // Non-critical
        }
      };
      loadMetadata();
    }
  }, [currentScanId, scanStatus]);

  // Build info object for RepositoryInfo component
  const repoInfoData = analysis
    ? {
        name: analysis.repository,
        description: analysis.description,
        stars: analysis.stars,
        forks: analysis.forks,
        language: analysis.language,
        branch: analysis.default_branch,
        lastCommit: analysis.last_commit,
      }
    : null;

  const showScanControls = scanActive || scanStatus === "completed" || scanStatus === "failed" || scanStatus === "cancelled";

  return (
    <div className="scanner-page">
      {/* Professional Repository Header (shown after analysis) or default ScanHeader */}
      {analysis ? (
        <RepositoryHeader
          repository={analysis}
          onStartScan={() => {
            if (selectedBranch && analysis) {
              handleScanStart({ repo: analysis.repository, branch: selectedBranch });
            }
          }}
          onGenerateReport={() => console.log("Generate Report")}
          onCompare={() => console.log("Compare")}
        />
      ) : (
        <ScanHeader />
      )}

      <RepositoryInput
        onValidate={handleValidate}
        onScanStart={handleScanStart}
        loading={validating || analyzing || scanActive}
        analysisMode={true}
      />

      {/* Analysis loading */}
      {analyzing && (
        <div className="analysis-loading">
          <div className="analysis-spinner" />
          <span>Analyzing repository...</span>
        </div>
      )}

      {/* Analysis error */}
      {analysisError && (
        <div className="analysis-error">
          <span>{analysisError}</span>
        </div>
      )}

      {/* Scan Config (shown when analysis exists) */}
      {analysis && (
        <div className="scanner-grid">
          <RepositoryInfo info={repoInfoData} />
          <ScanConfiguration config={scanConfig} onConfigChange={setScanConfig} />
        </div>
      )}

      {/* Branch Selector */}
      {analysis && analysis.branches?.length > 0 && (
        <BranchSelector
          branches={analysis.branches}
          selected={selectedBranch}
          onSelect={setSelectedBranch}
        />
      )}

      {/* ── Live Scan Progress (when scanning) ──────────────────── */}
      {showScanControls && (
        <div className="scanner-live-section">
          <div className="scanner-live-top">
            <ScanStatus status={scanStatus} riskScore={riskScore} />
            {scanActive && (
              <CancelScanButton scanId={currentScanId} onCancel={handleCancelScan} />
            )}
          </div>

          <div className="scanner-live-grid">
            <div className="scanner-live-main">
              <LiveProgress
                progress={progress}
                stage={currentStage}
                currentFile={currentFile}
                active={scanActive}
              />
              {scanActive && (
                <ETAWidget
                  eta={eta}
                  filesCompleted={filesCompleted}
                  filesTotal={filesTotal}
                />
              )}
            </div>
            <div className="scanner-live-side">
              <ScanTimeline events={timeline} />
              <ScanLogs logs={logs} />
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="scanner-analysis-grid">
          <div className="scanner-analysis-col">
            <LanguageCard languages={analysis.languages} />
            <RepositoryStats
              stats={{
                files: analysis.files,
                directories: analysis.directories,
                size: analysis.size,
                contributors: analysis.contributors,
                open_issues: analysis.open_issues,
              }}
            />
          </div>
          <div className="scanner-analysis-col">
            <DependencyCard
              dependencies={analysis.dependencies}
              dependencyFiles={analysis.dependency_files}
            />
            <FileTree files={analysis.file_tree} />
          </div>
        </div>
      )}

      {/* ── Scan Results with AI Explanation (Module D4) ─────────── */}
      <ScanResults results={scanResults} />

      <RecentScans scans={recentScans} />

      <ScanTemplates onTemplateSelect={(t) => console.log("Template:", t.name)} />
    </div>
  );
}
