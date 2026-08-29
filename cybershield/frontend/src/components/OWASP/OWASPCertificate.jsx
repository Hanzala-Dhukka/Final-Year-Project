import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { X, Download, Award, Shield, Swords } from "lucide-react";

const MODE_COLORS = {
  attack: { primary: "#dc2626", secondary: "#ef4444", gradient: "linear-gradient(135deg, #dc2626, #b91c1c)" },
  defense: { primary: "#16a34a", secondary: "#22c55e", gradient: "linear-gradient(135deg, #16a34a, #15803d)" },
};

export default function OWASPCertificate({ certificate, mode = "attack", onClose }) {
  const certRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const mc = MODE_COLORS[mode] || MODE_COLORS.attack;
  const isProfessional = certificate?.type?.includes("professional");

  const dateStr = certificate?.date_issued
    ? new Date(certificate.date_issued).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleDownload = async () => {
    if (!certRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 1122,
        height: 794,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1122, 794] });
      pdf.addImage(imgData, "PNG", 0, 0, 1122, 794);
      pdf.save(`CyberShield_${mode}_${certificate?.certificate_id || "certificate"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="cs-ow-cert-overlay" onClick={onClose}>
      <div className="cs-ow-cert-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cs-ow-cert-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="cs-ow-cert-header">
          <span className="cs-ow-cert-mode-badge" style={{ background: mc.gradient }}>
            {mode === "attack" ? <Swords size={14} /> : <Shield size={14} />}
            {mode === "attack" ? "Attack Mode" : "Defense Mode"}
          </span>
          <h3>Certificate Generated!</h3>
        </div>

        {/* Hidden render target for PDF */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={certRef} style={{ width: 1122, height: 794, overflow: "hidden" }}>
            <CertInner cert={certificate} mode={mode} mc={mc} dateStr={dateStr} isPro={isProfessional} />
          </div>
        </div>

        {/* Visible preview */}
        <div className="cs-ow-cert-preview">
          <div style={{ transform: "scale(0.45)", transformOrigin: "top left", width: "222%", height: "222%" }}>
            <CertInner cert={certificate} mode={mode} mc={mc} dateStr={dateStr} isPro={isProfessional} />
          </div>
        </div>

        <button
          className="cs-ow-cert-download-btn"
          onClick={handleDownload}
          disabled={generating}
          style={{ background: mc.gradient }}
        >
          {generating ? (
            <>
              <span className="cs-ow-spin" /> Generating PDF...
            </>
          ) : (
            <>
              <Download size={16} /> Download Certificate PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CertInner({ cert, mode, mc, dateStr, isPro }) {
  const ModeIcon = mode === "attack" ? Swords : Shield;

  return (
    <div
      style={{
        width: 1122,
        height: 794,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif",
        background: "#ffffff",
        color: "#1f2937",
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: mc.gradient }} />

      {/* Border frame */}
      <div
        style={{
          position: "absolute",
          inset: 20,
          border: `3px solid ${mc.primary}20`,
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 28,
          border: `1px solid ${mc.primary}10`,
          borderRadius: 2,
        }}
      />

      {/* Corner accents */}
      {[
        { top: 16, left: 16, borderTop: `3px solid ${mc.primary}`, borderLeft: `3px solid ${mc.primary}` },
        { top: 16, right: 16, borderTop: `3px solid ${mc.primary}`, borderRight: `3px solid ${mc.primary}` },
        { bottom: 16, left: 16, borderBottom: `3px solid ${mc.primary}`, borderLeft: `3px solid ${mc.primary}` },
        { bottom: 16, right: 16, borderBottom: `3px solid ${mc.primary}`, borderRight: `3px solid ${mc.primary}` },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 40, height: 40, ...s }} />
      ))}

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "50px 80px",
          textAlign: "center",
        }}
      >
        {/* Shield + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={mc.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" stroke="#22c55e" />
          </svg>
          <div style={{ fontSize: 13, letterSpacing: 6, textTransform: "uppercase", color: mc.primary, fontWeight: 700 }}>
            CyberShield
          </div>
        </div>

        <div style={{ fontSize: isPro ? 28 : 30, fontWeight: 700, color: "#111827", marginTop: 4, letterSpacing: 1 }}>
          {isPro
            ? (cert?.professional_message || (mode === "attack" ? "You are now a Professional Penetration Tester" : "You are now a Professional Security Defender"))
            : "Certificate of Achievement"}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>
          OWASP Top 10 Security Training - {mode === "attack" ? "Attack" : "Defense"} Mode
        </div>

        {/* Divider */}
        <div style={{ width: 120, height: 2, background: `linear-gradient(90deg,transparent,${mc.primary},transparent)`, margin: "14px 0" }} />

        {/* Recipient */}
        <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
          Awarded To
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: mc.primary, textShadow: `0 0 30px ${mc.primary}20` }}>
          {cert?.user_name || "CyberShield User"}
        </div>
        <div
          style={{
            width: 280,
            height: 1,
            background: `linear-gradient(90deg,transparent,${mc.primary},transparent)`,
            margin: "6px 0 14px",
          }}
        />

        {/* Body text */}
        <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.8, maxWidth: 650 }}>
          {isPro ? (
            <>
              Has successfully completed <strong style={{ color: mc.primary }}>all 15 OWASP vulnerability categories</strong>
              <br />
              in {mode === "attack" ? "offensive security" : "defensive security"} training,
              <br />
              demonstrating comprehensive expertise as a professional{" "}
              {mode === "attack" ? "penetration tester" : "security defender"}.
            </>
          ) : (
            <>
              For successfully completing the{" "}
              <strong style={{ color: mc.primary }}>{cert?.vulnerability_type || "OWASP Security Training"}</strong>{" "}
              {mode === "attack" ? "attack" : "defense"} lab at{" "}
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: `${mc.primary}10`,
                  color: mc.primary,
                  border: `1px solid ${mc.primary}30`,
                }}
              >
                {cert?.difficulty || "Intermediate"}
              </span>{" "}
              difficulty level
            </>
          )}
        </div>

        <div style={{ width: 120, height: 2, background: `linear-gradient(90deg,transparent,${mc.primary},transparent)`, margin: "14px 0" }} />

        {/* Stats */}
        <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.8 }}>
          <strong style={{ color: mc.primary }}>Score:</strong> {cert?.score || 100}% &nbsp;&#8226;&nbsp;
          <strong style={{ color: mc.primary }}>Labs Completed:</strong> {cert?.labs_completed || 1}{cert?.total_labs ? ` / ${cert.total_labs}` : ""}
          <br />
          <strong style={{ color: mc.primary }}>OWASP Category:</strong> {cert?.owasp_category || "A03:2021 - Injection"}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 2 }}>Certificate ID: {cert?.certificate_id || "N/A"}</div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Issued: {dateStr}</div>
          <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 4, letterSpacing: 1 }}>
            OWASP Top 10 (2021) Security Training Program - CyberShield
          </div>
        </div>
      </div>

      {/* Mode icon watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          right: 60,
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: `2px solid ${mc.primary}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.3,
        }}
      >
        <ModeIcon size={28} color={mc.primary} />
      </div>

      {/* QR-style block */}
      <div
        style={{
          position: "absolute",
          bottom: 55,
          left: 60,
          display: "grid",
          gridTemplateColumns: "repeat(5,7px)",
          gap: 2,
          opacity: 0.15,
        }}
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} style={{ width: 7, height: 7, background: mc.primary, opacity: i % 2 === 0 ? 1 : 0.4 }} />
        ))}
      </div>
    </div>
  );
}
