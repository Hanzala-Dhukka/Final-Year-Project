import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  ChevronUp,
  ChevronLeft,
  Copy,
  Check,
  X,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Loader2,
  Sparkles,
  Search,
} from "lucide-react";
import CodeViewer from "../../components/CodeViewer/CodeViewer";
import FindingList from "../../components/CodeViewer/FindingList";
import AIFixPanel from "../../components/CodeViewer/AIFixPanel";
import CodeViewerToolbar from "../../components/CodeViewer/CodeViewerToolbar";
import useCodeViewer from "../../hooks/useCodeViewer";
import "../../styles/codeViewer.css";

/* ── Severity configuration ────────────────────────────────────── */

const SEVERITY_CONFIG = {
  Critical: {
    Icon: AlertCircle,
    dot: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
  },
  High: {
    Icon: AlertTriangle,
    dot: "bg-orange-500",
    text: "text-orange-400",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
  },
  Medium: {
    Icon: Info,
    dot: "bg-yellow-500",
    text: "text-yellow-400",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
  },
  Low: {
    Icon: Shield,
    dot: "bg-green-500",
    text: "text-green-400",
    bg: "bg-green-500/15",
    border: "border-green-500/30",
  },
};

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/* ── Helper: extract top-level directory from a file path ──────── */

function getTopDir(filePath) {
  if (!filePath) return "";
  const parts = filePath.split("/");
  return parts.length > 1 ? parts[0] : "";
}

function getFileName(filePath) {
  if (!filePath) return "";
  const parts = filePath.split("/");
  return parts[parts.length - 1];
}

/* ── Loading skeleton ──────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="code-viewer-container">
      {/* Sidebar skeleton */}
      <div className="code-viewer-sidebar">
        <div className="skeleton-sidebar">
          <div className="skeleton-line long" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
          <div className="skeleton-line long" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
          <div className="skeleton-line long" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line long" />
          <div className="skeleton-line short" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line long" />
        </div>
      </div>

      {/* Editor skeleton */}
      <div className="code-viewer-main">
        <div className="code-viewer-toolbar">
          <div className="skeleton-line short" style={{ width: 200, height: 12 }} />
          <div className="skeleton-line short" style={{ width: 80, height: 12 }} />
        </div>
        <div className="skeleton-editor">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="skeleton-line" style={{ width: `${50 + Math.random() * 50}%` }} />
          ))}
        </div>
      </div>

      {/* AI panel skeleton */}
      <div className="code-viewer-ai-panel">
        <div className="skeleton-sidebar">
          <div className="skeleton-line long" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line long" />
          <div className="skeleton-line short" />
          <div className="skeleton-line long" />
          <div className="skeleton-line medium" />
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */

function EmptyState({ message, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <FileCode size={28} className="text-gray-600" />
      </div>
      <h3 className="empty-state-title">{message}</h3>
      {sub && <p className="empty-state-desc">{sub}</p>}
    </div>
  );
}

/* ── File Explorer sidebar ─────────────────────────────────────── */

function FileExplorer({ files, currentFile, onSelectFile, severityCounts }) {
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Build a directory tree from flat file list
  const tree = useMemo(() => {
    if (!files || files.length === 0) return [];

    // Group by top-level directory
    const dirMap = {};
    for (const entry of files) {
      const filePath = entry.file || entry.path || entry;
      const topDir = getTopDir(filePath) || "(root)";

      if (!dirMap[topDir]) {
        dirMap[topDir] = [];
      }
      dirMap[topDir].push(filePath);
    }

    return Object.entries(dirMap).sort(([a], [b]) => a.localeCompare(b));
  }, [files]);

  // Filter by search
  const filteredTree = useMemo(() => {
    if (!searchTerm) return tree;
    const term = searchTerm.toLowerCase();
    return tree
      .map(([dir, files]) => [
        dir,
        files.filter((f) => f.toLowerCase().includes(term)),
      ])
      .filter(([, files]) => files.length > 0);
  }, [tree, searchTerm]);

  // Auto-expand dirs on first render
  useEffect(() => {
    if (tree.length > 0 && expandedDirs.size === 0) {
      setExpandedDirs(new Set(tree.map(([dir]) => dir)));
    }
  }, [tree]);

  const toggleDir = useCallback((dir) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) {
        next.delete(dir);
      } else {
        next.add(dir);
      }
      return next;
    });
  }, []);

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <span>Explorer</span>
        <span className="text-gray-600">{files.length} files</span>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 10px" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={12}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#4b5563",
            }}
          />
          <input
            type="text"
            placeholder="Filter files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "4px 8px 4px 26px",
              fontSize: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6,
              color: "#e2e8f0",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Tree */}
      {filteredTree.map(([dir, dirFiles]) => (
        <div key={dir}>
          <div
            className="file-tree-dir"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              paddingLeft: 12,
              cursor: "pointer",
            }}
            onClick={() => toggleDir(dir)}
          >
            {expandedDirs.has(dir) ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            {expandedDirs.has(dir) ? (
              <FolderOpen size={13} className="text-yellow-500/70" />
            ) : (
              <Folder size={13} className="text-yellow-500/70" />
            )}
            <span>{dir}</span>
          </div>
          <AnimatePresence>
            {expandedDirs.has(dir) &&
              dirFiles.sort().map((filePath) => {
                const isActive = filePath === currentFile;
                const fCount =
                  severityCounts?.[filePath] ||
                  0;
                return (
                  <motion.div
                    key={filePath}
                    className={`file-tree-node ${isActive ? "active" : ""}`}
                    style={{ paddingLeft: 32 }}
                    onClick={() => onSelectFile(filePath)}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <FileCode size={13} className={isActive ? "text-blue-400" : "text-gray-500"} />
                    <span className="file-name">{getFileName(filePath)}</span>
                    {fCount > 0 && (
                      <span className="finding-count">{fCount}</span>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      ))}

      {filteredTree.length === 0 && (
        <div style={{ padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#4b5563" }}>No files found</p>
        </div>
      )}
    </div>
  );
}

/* ── Findings sidebar panel ────────────────────────────────────── */

function FindingsPanel({ fileFindings, activeFinding, onSelectFinding }) {
  const sortedFindings = useMemo(() => {
    return [...fileFindings].sort(
      (a, b) =>
        (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
    );
  }, [fileFindings]);

  return (
    <div className="findings-panel">
      <div className="findings-panel-header">
        <span>Problems</span>
        <span style={{ fontWeight: 400, color: "#4b5563" }}>
          {fileFindings.length}
        </span>
      </div>
      <div className="findings-panel-list">
        {sortedFindings.length === 0 ? (
          <div style={{ padding: 16, textAlign: "center" }}>
            <Shield size={20} className="text-gray-600" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: 12, color: "#4b5563" }}>
              No findings in this file
            </p>
          </div>
        ) : (
          sortedFindings.map((finding, idx) => {
            const isActive =
              activeFinding &&
              (activeFinding._id === finding._id ||
                activeFinding.id === finding.id);
            const sev = finding.severity || "Medium";
            const config = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.Medium;
            const SevIcon = config.Icon;

            return (
              <motion.div
                key={finding._id || finding.id || idx}
                className={`finding-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectFinding(finding)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.02 }}
              >
                <SevIcon size={14} className={`${config.text} shrink-0 mt-0.5`} />
                <div className="finding-item-content">
                  <div className="finding-item-title">
                    {finding.type || finding.rule || "Finding"}
                  </div>
                  <div className="finding-item-meta">
                    <span style={{ color: "#64748b" }}>L{finding.line || "?"}</span>
                    <span style={{ color: "#334155" }}>|</span>
                    <span style={{ color: config.text.replace("text-", "") }}>
                      {sev}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Main CodeViewerPage ───────────────────────────────────────── */

export default function CodeViewerPage() {
  const { scanId: urlScanId } = useParams();
  const navigate = useNavigate();

  // If no scanId in URL, try to get from localStorage
  const [scanId, setScanId] = useState(() => {
    return urlScanId || localStorage.getItem("lastScanId") || null;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState("code"); // files | code | ai

  // All state management lives in the hook
  const {
    files,
    findings,
    currentFile,
    fileContent,
    language,
    activeFinding,
    fileFindings,
    severityCounts,
    loading,
    fileLoading,
    aiAnalysis,
    aiLoading,
    aiError,
    editorRef,
    selectFile,
    selectFinding,
    navigateFinding,
    handleEditorMount,
    requestAiAnalysis,
    clearAiAnalysis,
  } = useCodeViewer(scanId);

  // Build per-file finding counts for the sidebar dots
  const fileFindingCounts = useMemo(() => {
    const counts = {};
    for (const f of findings) {
      const filePath = f.file;
      if (!counts[filePath]) {
        counts[filePath] = { total: 0, bySeverity: {} };
      }
      counts[filePath].total++;
      const sev = f.severity || "Unknown";
      counts[filePath].bySeverity[sev] =
        (counts[filePath].bySeverity[sev] || 0) + 1;
    }
    return counts;
  }, [findings]);

  // Persist scanId
  useEffect(() => {
    if (scanId) {
      localStorage.setItem("lastScanId", scanId);
    }
  }, [scanId]);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when typing in inputs
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      // Monaco editor has its own key handling — don't override when focused
      if (editorRef.current?.hasWidgetFocus?.()) return;

      switch (e.key) {
        case "ArrowUp":
          if (e.altKey || e.ctrlKey) {
            e.preventDefault();
            navigateFinding("prev");
          }
          break;
        case "ArrowDown":
          if (e.altKey || e.ctrlKey) {
            e.preventDefault();
            navigateFinding("next");
          }
          break;
        case "Escape":
          if (activeFinding) {
            e.preventDefault();
            selectFinding(null);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFinding, navigateFinding, selectFinding, editorRef]);

  // ── Breadcrumb segments ──────────────────────────────────────
  const breadcrumb = useMemo(() => {
    if (!currentFile) return [];
    return currentFile.split("/");
  }, [currentFile]);

  // ── Copy file path ──────────────────────────────────────────
  const [copiedPath, setCopiedPath] = useState(false);

  const handleCopyPath = useCallback(() => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile).then(() => {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 1500);
    });
  }, [currentFile]);

  // ── Total finding counts by severity ─────────────────────────
  const globalSeverityCounts = useMemo(() => {
    const counts = {};
    for (const f of findings) {
      const sev = f.severity || "Unknown";
      counts[sev] = (counts[sev] || 0) + 1;
    }
    return counts;
  }, [findings]);

  // ── Empty / loading states ──────────────────────────────────
  if (!scanId) {
    return (
      <div className="code-viewer-container" style={{ height: "100vh" }}>
        <EmptyState
          message="No Scan Selected"
          sub="Select a scan from the scan history to view findings in the code viewer."
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (files.length === 0 && !loading) {
    return (
      <div className="code-viewer-container" style={{ height: "100vh" }}>
        <EmptyState
          message="No Files Found"
          sub="This scan did not produce any file-level findings, or the data is still loading."
        />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <motion.div
      className={`code-viewer-container ${fullscreen ? "code-viewer-fullscreen" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mobile tab bar */}
      <div className="code-viewer-mobile-tabs" style={{ gridColumn: "1 / -1" }}>
        <div className="mobile-tab-bar">
          {[
            { key: "files", label: "Files", icon: Folder },
            { key: "code", label: "Code", icon: FileCode },
            { key: "ai", label: "AI", icon: Sparkles },
          ].map(({ key, label, icon: TabIcon }) => (
            <div
              key={key}
              className={`mobile-tab ${mobileTab === key ? "active" : ""}`}
              onClick={() => setMobileTab(key)}
            >
              <TabIcon size={14} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Left sidebar ──────────────────────────────────────── */}
      <motion.div
        className={`code-viewer-sidebar ${
          mobileTab === "files" ? "mobile-visible" : ""
        }`}
        initial={false}
        animate={{
          width: sidebarOpen ? undefined : 0,
          opacity: sidebarOpen ? 1 : 0,
          overflow: sidebarOpen ? "visible" : "hidden",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Toggle button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 8px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
            {/* Severity summary dots */}
            {["Critical", "High", "Medium", "Low"].map((sev) => {
              const count = globalSeverityCounts[sev] || 0;
              if (count === 0) return null;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <span
                  key={sev}
                  title={`${count} ${sev}`}
                  style={{
                    fontSize: 10,
                    color: cfg.text.replace("text-", "").includes("red") ? "#fca5a5"
                      : cfg.text.includes("orange") ? "#fdba74"
                      : cfg.text.includes("yellow") ? "#fde047"
                      : "#86efac",
                    fontFamily: "monospace",
                  }}
                >
                  {count}
                </span>
              );
            })}
          </div>
          <button
            className="cv-btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>

        {/* File explorer */}
        <FileExplorer
          files={files}
          currentFile={currentFile}
          onSelectFile={selectFile}
          severityCounts={fileFindingCounts}
        />

        {/* Findings for current file */}
        <FindingsPanel
          fileFindings={fileFindings}
          activeFinding={activeFinding}
          onSelectFinding={selectFinding}
        />
      </motion.div>

      {/* Sidebar collapsed toggle */}
      {!sidebarOpen && (
        <button
          className="cv-btn-icon"
          onClick={() => setSidebarOpen(true)}
          title="Open sidebar"
          style={{
            position: "absolute",
            left: 4,
            top: 48,
            zIndex: 10,
            background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <PanelLeftOpen size={14} />
        </button>
      )}

      {/* ── Main editor area ──────────────────────────────────── */}
      <div className="code-viewer-main">
        {/* Toolbar */}
        <div className="code-viewer-toolbar">
          <div className="code-viewer-toolbar-left">
            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <div className="breadcrumb">
                {breadcrumb.map((segment, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                    {i > 0 && <span className="breadcrumb-separator">
                      <ChevronRight size={10} />
                    </span>}
                    <span
                      className={`breadcrumb-segment ${
                        i === breadcrumb.length - 1 ? "active" : ""
                      }`}
                    >
                      {segment}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Language badge */}
            {language && language !== "plaintext" && (
              <span className="language-badge">{language}</span>
            )}

            {/* File loading indicator */}
            {fileLoading && (
              <Loader2 size={12} className="text-blue-400 animate-spin" />
            )}

            {/* Copy path */}
            {currentFile && (
              <button
                className="cv-btn-icon"
                onClick={handleCopyPath}
                title="Copy file path"
              >
                {copiedPath ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            )}
          </div>

          <div className="code-viewer-toolbar-right">
            {/* Finding navigation */}
            {fileFindings.length > 0 && (
              <div className="finding-counter">
                <button
                  className="cv-btn-icon"
                  style={{ width: 18, height: 18 }}
                  onClick={() => navigateFinding("prev")}
                  title="Previous finding (Ctrl+↑)"
                >
                  <ChevronUp size={12} />
                </button>
                <span style={{ fontSize: 10 }}>
                  {activeFinding
                    ? fileFindings.findIndex(
                        (f) =>
                          f._id === activeFinding?._id ||
                          f.id === activeFinding?.id
                      ) + 1
                    : 0}
                  /{fileFindings.length}
                </span>
                <button
                  className="cv-btn-icon"
                  style={{ width: 18, height: 18 }}
                  onClick={() => navigateFinding("next")}
                  title="Next finding (Ctrl+↓)"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            )}

            {/* Refresh */}
            <button
              className="cv-btn-icon"
              onClick={() => selectFile(currentFile)}
              title="Reload file"
            >
              <RefreshCw size={13} />
            </button>

            {/* Fullscreen toggle */}
            <button
              className="cv-btn-icon"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* AI panel toggle */}
            <button
              className="cv-btn-icon"
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              title={aiPanelOpen ? "Close AI panel" : "Open AI panel"}
            >
              {aiPanelOpen ? (
                <PanelRightClose size={14} />
              ) : (
                <PanelRightOpen size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {fileContent ? (
            <CodeViewer
              content={fileContent}
              language={language}
              onMount={handleEditorMount}
              loading={fileLoading}
            />
          ) : fileLoading ? (
            <div className="skeleton-editor">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-line"
                  style={{ width: `${40 + Math.random() * 55}%` }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message="Select a File"
              sub="Choose a file from the explorer to view its contents."
            />
          )}
        </div>
      </div>

      {/* ── Right AI panel ────────────────────────────────────── */}
      <AnimatePresence>
        {aiPanelOpen && (
          <motion.div
            className={`code-viewer-ai-panel ${
              mobileTab === "ai" ? "mobile-visible" : ""
            }`}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AIFixPanel
              finding={activeFinding}
              analysis={aiAnalysis}
              loading={aiLoading}
              error={aiError}
              onExplain={requestAiAnalysis}
              onDismiss={clearAiAnalysis}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
