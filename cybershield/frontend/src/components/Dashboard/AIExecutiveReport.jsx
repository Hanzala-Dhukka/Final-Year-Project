import { useEffect, useState, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getExecutiveReport } from "../../api/aiDashboardApi";
import "./AIExecutiveReport.css";

const RISK_CLS = {
  Low: "er-risk--low", Medium: "er-risk--medium",
  High: "er-risk--high", Critical: "er-risk--critical",
};

const DEADLINE_CLS = {
  Immediate: "dl--red", "1 Week": "dl--orange", "1 Month": "dl--blue",
};

export default function AIExecutiveReport({ securityData }) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [exporting, setExp]   = useState(false);
  const reportRef = useRef(null);

  const load = useCallback(async () => {
    if (!securityData) return;
    setLoading(true); setError(false);
    try {
      const res = await getExecutiveReport(securityData);
      setReport(res.report);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [securityData]);

  useEffect(() => { load(); }, [load]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExp(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#1e293b",
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = 210;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`cybershield-executive-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setExp(false);
    }
  };

  return (
    <div className="er-widget widget-card" aria-label="Executive Security Report">
      <div className="er-header">
        <div className="er-title-row">
          <span aria-hidden="true">📋</span>
          <h3 className="er-title">Executive Report</h3>
        </div>
        <div className="er-header-actions">
          <button className="er-refresh" onClick={load} aria-label="Refresh report">↻</button>
          <button
            className="er-export-btn"
            onClick={exportPDF}
            disabled={exporting || loading || !report}
            aria-label="Export report as PDF"
          >
            {exporting ? "Exporting…" : "📄 PDF"}
          </button>
        </div>
      </div>

      {loading && <div className="er-loading" aria-busy="true"><span className="er-spinner" />Generating report…</div>}
      {!loading && error && <div className="er-error">⚠️ <button onClick={load}>Retry</button></div>}

      {!loading && !error && report && (
        <div ref={reportRef} className="er-body">
          <div className="er-meta-row">
            <span className={`er-risk ${RISK_CLS[report.current_risk] ?? ""}`}>
              {report.current_risk} Risk
            </span>
            <span className="er-score">{report.score}<sub>/100</sub></span>
            <span className="er-compliance">{report.compliance_status}</span>
          </div>

          <p className="er-summary">{report.executive_summary}</p>

          {report.key_findings?.length > 0 && (
            <div className="er-section">
              <p className="er-section-label">Key Findings</p>
              <ul className="er-findings">
                {report.key_findings.map((f, i) => (
                  <li key={i}><span aria-hidden="true">•</span> {f}</li>
                ))}
              </ul>
            </div>
          )}

          {report.priority_actions?.length > 0 && (
            <div className="er-section">
              <p className="er-section-label">Priority Actions</p>
              <ol className="er-actions">
                {report.priority_actions.map((a, i) => (
                  <li key={i} className="er-action-item">
                    <span className="er-action-text">{a.action}</span>
                    <div className="er-action-meta">
                      <span className="er-owner">{a.owner}</span>
                      <span className={`er-deadline ${DEADLINE_CLS[a.deadline] ?? ""}`}>
                        {a.deadline}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {report.next_review && (
            <p className="er-next-review">📅 Next review: <strong>{report.next_review}</strong></p>
          )}
        </div>
      )}
    </div>
  );
}
