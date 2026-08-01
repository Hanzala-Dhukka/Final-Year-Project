import { useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";

/**
 * CodeViewer — Monaco Editor-based code viewer with vulnerability decorations.
 *
 * Props:
 *   code            – string source code to display
 *   language        – language id for Monaco (e.g. "python", "javascript")
 *   findings        – array of finding objects with { line, severity }
 *   activeFinding   – the currently selected finding (or null)
 *   onFindingClick  – callback(finding) when a decorated line is clicked
 *   onEditorMount   – callback(editor, monaco) after editor is ready
 */

const SEVERITY_COLORS = {
  Critical: { bg: "rgba(239,68,68,0.15)", border: "#ef4444", glyph: "rgba(239,68,68,0.8)" },
  High: { bg: "rgba(249,115,22,0.15)", border: "#f97316", glyph: "rgba(249,115,22,0.8)" },
  Medium: { bg: "rgba(234,179,8,0.15)", border: "#eab308", glyph: "rgba(234,179,8,0.8)" },
  Low: { bg: "rgba(34,197,94,0.15)", border: "#22c55e", glyph: "rgba(34,197,94,0.8)" },
};

function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col">
      <div className="h-10 bg-gray-800/60 border-b border-gray-700/50 animate-pulse" />
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-3 bg-gray-700/40 rounded" />
            <div
              className="h-3 bg-gray-700/30 rounded"
              style={{ width: `${30 + Math.random() * 50}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CodeViewer({
  code = "",
  language = "plaintext",
  findings = [],
  activeFinding = null,
  onFindingClick,
  onEditorMount,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  /**
   * Apply line decorations for all findings.
   */
  const applyDecorations = useCallback(
    (editor, monaco) => {
      if (!editor || !monaco) return;

      const newDecorations = findings
        .filter((f) => f.line)
        .map((finding) => {
          const severity = finding.severity || "Medium";
          const config = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Medium;

          return {
            range: new monaco.Range(finding.line, 1, finding.line, 100),
            options: {
              isWholeLine: true,
              className: `severity-${severity.toLowerCase()}`,
              glyphMarginClassName: `glyph-${severity.toLowerCase()}`,
              glyphMarginHoverMessage: {
                value: `**${severity}** — ${finding.rule_name || finding.type || "Vulnerability"}`,
              },
              minimap: { color: config.border, position: 1 },
              overviewRuler: {
                color: config.border,
                position: monaco.editor.OverviewRulerLane.Full,
              },
            },
          };
        });

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        newDecorations
      );
    },
    [findings]
  );

  /**
   * Handle Monaco editor mount — register theme, decorations, expose instance.
   */
  const handleEditorMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Register custom severity decoration styles
      Object.entries(SEVERITY_COLORS).forEach(([severity, config]) => {
        const lower = severity.toLowerCase();

        // Line highlight
        monaco.editor.defineTheme(`severity-${lower}`, {
          base: "vs-dark",
          inherit: true,
          rules: [],
          colors: {
            [`editor.lineHighlightBackground${lower}`]: config.bg,
          },
        });

        // Inject CSS for severity classes
        const styleId = `severity-style-${lower}`;
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
            .severity-${lower} {
              background-color: ${config.bg};
              border-left: 3px solid ${config.border};
            }
            .glyph-${lower} {
              background-color: ${config.glyph};
              border-radius: 50%;
              width: 10px !important;
              height: 10px !important;
              margin: 3px 4px;
            }
          `;
          document.head.appendChild(style);
        }
      });

      // Apply decorations for findings
      applyDecorations(editor, monaco);

      // Notify parent
      if (onEditorMount) onEditorMount(editor, monaco);
    },
    [applyDecorations, onEditorMount]
  );

  // Re-apply decorations when findings change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      applyDecorations(editorRef.current, monacoRef.current);
    }
  }, [findings, applyDecorations]);

  // Scroll to active finding when it changes
  useEffect(() => {
    if (editorRef.current && activeFinding?.line) {
      editorRef.current.revealLineInCenter(activeFinding.line);
      editorRef.current.setPosition({
        lineNumber: activeFinding.line,
        column: 1,
      });
      editorRef.current.focus();
    }
  }, [activeFinding]);

  return (
    <div className="relative flex-1 min-h-0 bg-gray-900 rounded-lg overflow-hidden border border-gray-700/50">
      <LoadingSkeleton />
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        options={{
          readOnly: true,
          fontSize: 14,
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: "on",
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 8,
          lineNumbersMinChars: 4,
          padding: { top: 12 },
          renderLineHighlight: "all",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          smoothScrolling: true,
          cursorBlinking: "solid",
          cursorSmoothCaretAnimation: "on",
        }}
        onMount={handleEditorMount}
      />
    </div>
  );
}
