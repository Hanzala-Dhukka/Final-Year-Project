import { useState, useEffect } from "react";
import useDashboardSocket from "../../hooks/useDashboardSocket";
import "./LiveScanProgress.css";

const IDLE_AFTER_MS = 10_000; // reset to idle 10 s after last progress event

export default function LiveScanProgress() {
  const { event, connected } = useDashboardSocket();

  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("idle"); // idle | scanning | completed | error

  // Reset to idle after a quiet period
  useEffect(() => {
    if (status !== "scanning") return;
    const id = setTimeout(() => {
      setStatus("idle");
      setProgress(0);
      setFile("");
    }, IDLE_AFTER_MS);
    return () => clearTimeout(id);
  }, [progress, status]);

  // React to WebSocket events
  useEffect(() => {
    if (!event) return;

    if (event.event === "scan_progress") {
      setStatus("scanning");
      setProgress(Math.min(100, Math.max(0, event.progress ?? 0)));
      setFile(event.file ?? "");
      setProject(event.project ?? "");
    }

    if (event.event === "scan_completed") {
      setStatus("completed");
      setProgress(100);
      setProject(event.project ?? "");
      setFile("");
    }

    if (event.event === "scan_error") {
      setStatus("error");
    }
  }, [event]);

  const isActive  = status === "scanning";
  const isDone    = status === "completed";
  const isIdle    = status === "idle";
  const isError   = status === "error";

  return (
    <div
      className={`lsp-widget widget-card lsp--${status}`}
      aria-label="Live Scan Progress"
    >
      <div className="lsp-header">
        <div className="lsp-title-row">
          <span className="lsp-icon" aria-hidden="true">
            {isDone ? "✅" : isError ? "❌" : isActive ? "⏳" : "🔍"}
          </span>
          <h3 className="lsp-title">
            {isDone   ? "Scan Complete"   :
             isError  ? "Scan Error"      :
             isActive ? "Scanning…"       :
                        "Live Scan Progress"}
          </h3>
        </div>
        <span className={`lsp-conn ${connected ? "lsp-conn--live" : "lsp-conn--off"}`}>
          <span className="lsp-pulse" aria-hidden="true" />
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      {isIdle && !project && (
        <div className="lsp-idle">
          <p>No active scan.</p>
          <p className="lsp-idle-sub">Scan progress will stream here in real time.</p>
        </div>
      )}

      {(isActive || isDone || isError || project) && (
        <>
          {project && (
            <p className="lsp-project">
              <span className="lsp-project-label">Project:</span> {project}
            </p>
          )}

          <div
            className="lsp-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Scan progress: ${progress}%`}
          >
            <div
              className={`lsp-fill lsp-fill--${status}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="lsp-meta">
            <span className="lsp-pct">{progress}%</span>
            {file && <span className="lsp-file" title={file}>📄 {file}</span>}
          </div>

          {isDone && (
            <p className="lsp-done-msg">
              ✅ Scan finished — check the Live Threat Feed for results.
            </p>
          )}
          {isError && (
            <p className="lsp-error-msg">
              ❌ An error occurred during the scan. Please try again.
            </p>
          )}
        </>
      )}
    </div>
  );
}
