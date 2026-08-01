import { useState, useCallback, useRef, useEffect } from "react";
import API from "../api/api";
import { getFindings, getFindingsByFile } from "../api/findingsApi";

/**
 * Severity → Monaco decoration colour mapping.
 * Each entry defines a line highlight (background) and a gutter icon colour.
 */
const SEVERITY_DECORATIONS = {
  Critical: {
    highlight: "rgba(220, 38, 38, 0.15)",
    highlightActive: "rgba(220, 38, 38, 0.25)",
    borderColor: "#dc2626",
    glyphColor: "#dc2626",
    className: "severity-critical",
    activeClassName: "severity-critical-active",
  },
  High: {
    highlight: "rgba(249, 115, 22, 0.15)",
    highlightActive: "rgba(249, 115, 22, 0.25)",
    borderColor: "#f97316",
    glyphColor: "#f97316",
    className: "severity-high",
    activeClassName: "severity-high-active",
  },
  Medium: {
    highlight: "rgba(234, 179, 8, 0.15)",
    highlightActive: "rgba(234, 179, 8, 0.25)",
    borderColor: "#eab308",
    glyphColor: "#eab308",
    className: "severity-medium",
    activeClassName: "severity-medium-active",
  },
  Low: {
    highlight: "rgba(34, 197, 94, 0.15)",
    highlightActive: "rgba(34, 197, 94, 0.25)",
    borderColor: "#22c55e",
    glyphColor: "#22c55e",
    className: "severity-low",
    activeClassName: "severity-low-active",
  },
};

/**
 * Maps common file extensions to Monaco language identifiers.
 */
const EXTENSION_LANGUAGE_MAP = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  php: "php",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  swift: "swift",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  md: "markdown",
  dockerfile: "dockerfile",
  docker: "dockerfile",
  terraform: "hcl",
  tf: "hcl",
  tfvars: "hcl",
  vue: "html",
  svelte: "html",
};

/**
 * useCodeViewer — State management hook for the VS Code-style Code Viewer.
 *
 * Handles file loading, finding selection, editor decoration,
 * and keyboard navigation for the code viewer module.
 *
 * @param {string} scanId - The scan ID to load findings for
 */
export default function useCodeViewer(scanId) {
  // ── State ──────────────────────────────────────────────────────────
  const [files, setFiles] = useState([]);
  const [findings, setFindings] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [activeFinding, setActiveFinding] = useState(null);
  const [fileFindings, setFileFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const findingsRef = useRef([]);
  const decorationsRef = useRef([]);
  const currentFileRef = useRef(null);

  // Keep the ref in sync so callbacks always see the latest findings
  useEffect(() => {
    findingsRef.current = findings;
  }, [findings]);

  // Keep currentFileRef in sync
  useEffect(() => {
    currentFileRef.current = currentFile;
  }, [currentFile]);

  // ── Language detection ──────────────────────────────────────────────
  const detectLanguage = useCallback((filePath) => {
    if (!filePath) return "plaintext";
    const parts = filePath.split(".");
    if (parts.length < 2) return "plaintext";
    const ext = parts.pop().toLowerCase();
    // Handle compound extensions like .spec.js
    const baseName = parts.pop() || "";
    if (ext === "js" && (baseName === "test" || baseName === "spec")) {
      return "javascript";
    }
    return EXTENSION_LANGUAGE_MAP[ext] || "plaintext";
  }, []);

  // ── File content fetching ───────────────────────────────────────────
  const fetchFileContent = useCallback(
    async (filePath) => {
      if (!filePath || !scanId) {
        setFileContent("");
        setLanguage("plaintext");
        return;
      }

      setFileLoading(true);
      try {
        const response = await API.get(`/scanner/${scanId}/file-content`, {
          params: { path: filePath },
        });
        setFileContent(response.data.content || "");
        setLanguage(response.data.language || detectLanguage(filePath));
      } catch (err) {
        console.error("Failed to load file content:", err);
        const errMsg = err.response?.data?.detail || err.message;
        setFileContent(
          `// Error loading file: ${filePath}\n// ${errMsg}\n\n// The file content could not be retrieved from the server.`
        );
        setLanguage("plaintext");
      } finally {
        setFileLoading(false);
      }
    },
    [scanId, detectLanguage]
  );

  // ── Filtering findings for a given file ─────────────────────────────
  const filterFindingsForFile = useCallback(
    (filePath, findingsList) => {
      if (!filePath || !findingsList || findingsList.length === 0) return [];
      return findingsList.filter((f) => f.file === filePath);
    },
    []
  );

  // ── Select a file ───────────────────────────────────────────────────
  const selectFile = useCallback(
    async (filePath) => {
      if (!filePath || !scanId) return;

      // Avoid re-loading the same file
      if (currentFileRef.current === filePath) return;

      setCurrentFile(filePath);
      setActiveFinding(null);
      setAiAnalysis(null);
      setAiError(null);

      // Fetch file content
      await fetchFileContent(filePath);

      // Use the ref to get the latest findings (they may not have
      // committed to state yet when called during loadFindings)
      const currentFindings = findingsRef.current;
      const matched = filterFindingsForFile(filePath, currentFindings);
      setFileFindings(matched);

      // Auto-select the first (highest-severity) finding
      if (matched.length > 0) {
        setActiveFinding(matched[0]);
      }
    },
    [scanId, fetchFileContent, filterFindingsForFile]
  );

  // ── Select a finding ────────────────────────────────────────────────
  const selectFinding = useCallback(
    (finding) => {
      if (!finding) return;

      setActiveFinding(finding);

      // If finding is in a different file, load that file
      if (finding.file !== currentFileRef.current) {
        selectFile(finding.file);
      }

      // Scroll editor to the finding line
      requestAnimationFrame(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (editor && monaco) {
          const line = finding.line || 1;
          const column = finding.column || 1;
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column });
          editor.focus();
        }
      });
    },
    [selectFile]
  );

  // ── Navigate finding (next / previous) ──────────────────────────────
  const navigateFinding = useCallback(
    (direction) => {
      if (fileFindings.length === 0) return;

      const currentIndex = fileFindings.findIndex(
        (f) => f._id === activeFinding?._id || f.id === activeFinding?.id
      );

      let nextIndex;
      if (direction === "next") {
        nextIndex =
          currentIndex < fileFindings.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex =
          currentIndex > 0 ? currentIndex - 1 : fileFindings.length - 1;
      }

      selectFinding(fileFindings[nextIndex]);
    },
    [fileFindings, activeFinding, selectFinding]
  );

  // ── AI Analysis ─────────────────────────────────────────────────────
  const requestAiAnalysis = useCallback(
    async (finding) => {
      if (!finding) return;

      setAiLoading(true);
      setAiError(null);
      setAiAnalysis(null);

      try {
        const { explainFinding } = await import("../api/vulnerabilityAiApi");
        const payload = {
          type: finding.type || finding.rule || "unknown",
          severity: finding.severity || "Medium",
          file: finding.file || "",
          code: finding.code || "",
          finding_id: finding._id || finding.id,
        };
        const result = await explainFinding(payload);
        setAiAnalysis(result.analysis || result);
      } catch (err) {
        console.error("AI analysis failed:", err);
        setAiError(
          err.response?.data?.detail ||
            err.message ||
            "AI analysis failed. Please try again."
        );
      } finally {
        setAiLoading(false);
      }
    },
    []
  );

  const clearAiAnalysis = useCallback(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, []);

  // ── Editor mount ────────────────────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define a custom theme that blends with the dark UI
    monaco.editor.defineTheme("cybershield-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "keyword", foreground: "C084FC" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "F59E0B" },
        { token: "type", foreground: "60A5FA" },
        { token: "function", foreground: "60A5FA" },
        { token: "variable", foreground: "F9FAFB" },
        { token: "operator", foreground: "9CA3AF" },
      ],
      colors: {
        "editor.background": "#0f172a",
        "editor.foreground": "#e2e8f0",
        "editor.lineHighlightBackground": "#1e293b",
        "editor.selectionBackground": "#3b82f640",
        "editor.inactiveSelectionBackground": "#3b82f620",
        "editorCursor.foreground": "#60A5FA",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#94a3b8",
        "editorGutter.background": "#0f172a",
        "editorIndentGuide.background": "#1e293b",
        "editorIndentGuide.activeBackground": "#334155",
        "editorWidget.background": "#1e293b",
        "editorWidget.border": "#334155",
        "editorSuggestWidget.background": "#1e293b",
        "editorSuggestWidget.border": "#334155",
        "editorSuggestWidget.selectedBackground": "#3b82f630",
        "minimap.background": "#0f172a",
        "scrollbarSlider.background": "#33415580",
        "scrollbarSlider.hoverBackground": "#47556980",
        "scrollbarSlider.activeBackground": "#64748b",
      },
    });

    monaco.editor.setTheme("cybershield-dark");

    // Register keyboard shortcuts for finding navigation
    editor.addAction({
      id: "cybershield-next-finding",
      label: "Go to Next Finding",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow],
      run: () => navigateFinding("next"),
    });

    editor.addAction({
      id: "cybershield-prev-finding",
      label: "Go to Previous Finding",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow],
      run: () => navigateFinding("prev"),
    });

    // Register click handler — click on a gutter line with a finding
    // selects that finding
    editor.onMouseDown((e) => {
      if (e.target.type === 2 /* Gutter */ || e.target.type === 4 /* LineDecorations */) {
        const line = e.target.position?.lineNumber;
        if (line) {
          const hit = findingsRef.current.find(
            (f) =>
              f.file === currentFileRef.current && f.line === line
          );
          if (hit) {
            selectFinding(hit);
          }
        }
      }
    });
  }, [navigateFinding, selectFinding]);

  // ── Update Monaco decorations ───────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !fileContent) return;

    // Build decoration list from all findings in the current file
    const newDecorations = [];
    const newOptions = [];

    for (const finding of fileFindings) {
      const line = finding.line || 1;
      const sev = finding.severity || "Medium";
      const config = SEVERITY_DECORATIONS[sev] || SEVERITY_DECORATIONS.Medium;
      const isActive =
        activeFinding &&
        (activeFinding._id === finding._id || activeFinding.id === finding.id);

      // Full-line highlight
      newDecorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: isActive
            ? config.activeClassName
            : config.className,
          overviewRuler: {
            color: config.borderColor,
            position: monaco.editor.OverviewRulerLane.Left,
          },
          minimap: {
            color: config.borderColor,
            position: monaco.editor.MinimapLane.Inline,
          },
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Gutter glyph (coloured circle) to indicate a finding on this line
      newOptions.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: `gutter-${sev.toLowerCase()}`,
          glyphMarginHoverMessage: {
            value: `**${sev}**: ${finding.type || finding.rule || "Finding"}`,
          },
        },
      });
    }

    // Merge decorations (highlights + glyphs) and apply atomically
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      [...newDecorations, ...newOptions]
    );
  }, [activeFinding, fileFindings, fileContent]);

  // ── Load all findings and file tree on mount ────────────────────────
  useEffect(() => {
    if (!scanId) return;

    let cancelled = false;

    const loadFindings = async () => {
      setLoading(true);
      try {
        const [findingsRes, filesRes] = await Promise.all([
          getFindings(scanId),
          getFindingsByFile(scanId),
        ]);

        if (cancelled) return;

        const loadedFindings = findingsRes.findings || [];
        const loadedFiles = filesRes.files || [];

        setFindings(loadedFindings);
        findingsRef.current = loadedFindings;
        setFiles(loadedFiles);

        // Auto-select the first file that has findings
        if (loadedFiles.length > 0) {
          const firstFile = loadedFiles[0].file || loadedFiles[0].path || loadedFiles[0];
          setCurrentFile(firstFile);
          currentFileRef.current = firstFile;

          // Fetch file content for the first file
          try {
            const response = await API.get(
              `/scanner/${scanId}/file-content`,
              { params: { path: firstFile } }
            );
            if (cancelled) return;

            setFileContent(response.data.content || "");
            setLanguage(
              response.data.language ||
                detectLanguage(firstFile)
            );

            // Filter findings for the first file
            const matched = loadedFindings.filter(
              (f) => f.file === firstFile
            );
            setFileFindings(matched);

            if (matched.length > 0) {
              setActiveFinding(matched[0]);
            }
          } catch (err) {
            console.error("Failed to load initial file:", err);
            setFileContent(
              `// Error loading file: ${firstFile}\n// ${err.message}`
            );
          }
        }
      } catch (err) {
        console.error("Failed to load findings:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFindings();

    return () => {
      cancelled = true;
    };
  }, [scanId, detectLanguage]);

  // ── Compute summary stats ───────────────────────────────────────────
  const severityCounts = {};
  for (const f of findings) {
    const sev = f.severity || "Unknown";
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;
  }

  // ── Return ──────────────────────────────────────────────────────────
  return {
    // Data
    files,
    findings,
    currentFile,
    fileContent,
    language,
    activeFinding,
    fileFindings,
    severityCounts,

    // Loading states
    loading,
    fileLoading,

    // AI state
    aiAnalysis,
    aiLoading,
    aiError,

    // Refs (for imperative access)
    editorRef,
    monacoRef,

    // Actions
    selectFile,
    selectFinding,
    navigateFinding,
    handleEditorMount,
    requestAiAnalysis,
    clearAiAnalysis,
  };
}
