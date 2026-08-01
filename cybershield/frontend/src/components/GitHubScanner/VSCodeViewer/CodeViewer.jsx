import { useRef, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import "./CodeViewer.css";

export default function CodeViewer({
  fileContent,
  loading,
  fileReport = [],
  activeFinding = null
}) {
  const decorationsRef = useRef([]);
  const editorRef = useRef(null);

  /* ── Derive current file findings from fileReport ───────────── */
  const currentFindings = useMemo(() => {
    if (!fileContent) return [];
    const fileEntry = fileReport.find(f => f.file === fileContent.file);
    if (!fileEntry) return [];
    return (fileEntry.issues || []).map(issue => ({
      ...issue,
      file: fileContent.file,
    }));
  }, [fileContent, fileReport]);

  /* ── Apply Monaco decorations when findings change ──────────── */
  useEffect(() => {
    if (!editorRef.current || !window.monaco || !fileContent) return;

    const editor = editorRef.current;
    const monaco = window.monaco;

    const decorations = currentFindings.map(issue => {
      const sev = (issue.severity || "low").toLowerCase();
      return {
        range: new monaco.Range(issue.line || 1, 1, issue.line || 1, 999),
        options: {
          isWholeLine: true,
          className: `severity-${sev}`,
          glyphMarginClassName: `glyph-${sev}`,
          glyphMarginHoverMessage: {
            value: `**${issue.type}**\n\n${issue.recommendation || "Review and remediate this issue"}`
          }
        }
      };
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      decorations
    );
  }, [currentFindings, fileContent]);

  /* ── Scroll to active finding (triggered by ProblemsPanel) ──── */
  useEffect(() => {
    if (!editorRef.current || !activeFinding) return;
    editorRef.current.revealLineInCenter(activeFinding.line || 1);
    editorRef.current.setPosition({ lineNumber: activeFinding.line || 1, column: 1 });
    editorRef.current.focus();
  }, [activeFinding]);

  /* ── Loading state ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="code-viewer">
        <div className="code-header">Loading...</div>
        <div className="viewer-loading">Loading source code...</div>
      </div>
    );
  }

  if (!fileContent) {
    return (
      <div className="code-viewer">
        <div className="code-header">—</div>
        <div className="viewer-loading">Select a file</div>
      </div>
    );
  }

  const code = fileContent.content
    .map(line => line.text)
    .join("\n");

  return (
    <div className="code-viewer">
      <div className="code-header">
        {fileContent.file}
        {currentFindings.length > 0 && (
          <span className="code-header-badge">
            {currentFindings.length} issue{currentFindings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="code-editor-wrap">
        <Editor
          height="100%"
          defaultLanguage={fileContent.language || "javascript"}
          value={code}
          theme="vs-dark"
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 14,
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            glyphMargin: true,
            folding: true,
            wordWrap: "off",
            automaticLayout: true,
            renderLineHighlight: "all",
            padding: { top: 10 }
          }}
        />
      </div>
    </div>
  );
}