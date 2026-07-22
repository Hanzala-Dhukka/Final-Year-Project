import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./ExportDashboard.css";

export default function ExportDashboard({ dashboardRef, className = "" }) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const exportPDF = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const element = dashboardRef?.current || document.getElementById("dashboard");
      if (!element) {
        throw new Error("Dashboard element not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`cybershield-dashboard-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`export-dashboard ${className}`}>
      <button
        className="export-btn"
        onClick={exportPDF}
        disabled={isExporting}
        aria-label="Export dashboard as PDF"
      >
        <span className="export-icon">📄</span>
        {isExporting ? "Exporting..." : "Export PDF"}
      </button>
      {error && <div className="export-error" role="alert">{error}</div>}
    </div>
  );
}