import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

const DIFF_COLORS = {
  beginner:    { bg: "#dcfce7", text: "#166534", glow: "#22c55e" },
  easy:        { bg: "#dcfce7", text: "#166534", glow: "#22c55e" },
  intermediate:{ bg: "#dbeafe", text: "#1e40af", glow: "#3b82f6" },
  medium:      { bg: "#dbeafe", text: "#1e40af", glow: "#3b82f6" },
  advanced:    { bg: "#ffedd5", text: "#9a3412", glow: "#f97316" },
  hard:        { bg: "#ffedd5", text: "#9a3412", glow: "#f97316" },
  expert:      { bg: "#fee2e2", text: "#991b1b", glow: "#ef4444" },
}

export default function CertificateTemplate({ certificate, type = "category" }) {
  const certRef = useRef(null)
  const [generating, setGenerating] = useState(false)

  const isProfessional = type === "professional" || certificate?.type === "professional"
  const diff = (certificate?.difficulty || "intermediate").toLowerCase()
  const dc = DIFF_COLORS[diff] || DIFF_COLORS.intermediate

  const handleDownload = async () => {
    if (!certRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2, useCORS: true, backgroundColor: null, logging: false,
        width: 1122, height: 794,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1122, 794] })
      pdf.addImage(imgData, "PNG", 0, 0, 1122, 794)
      pdf.save(`CyberShield_${certificate?.certificate_id || "certificate"}.pdf`)
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setGenerating(false)
    }
  }

  const dateStr = certificate?.date_issued
    ? new Date(certificate.date_issued).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const corners = [
    { top: 12, left: 12, borderTop: "3px solid #c9a84c", borderLeft: "3px solid #c9a84c" },
    { top: 12, right: 12, borderTop: "3px solid #c9a84c", borderRight: "3px solid #c9a84c" },
    { bottom: 12, left: 12, borderBottom: "3px solid #c9a84c", borderLeft: "3px solid #c9a84c" },
    { bottom: 12, right: 12, borderBottom: "3px solid #c9a84c", borderRight: "3px solid #c9a84c" },
  ]

  return (
    <div>
      {/* Hidden render target for PDF */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={certRef} style={{ width: 1122, height: 794, overflow: "hidden" }}>
          <CertInner cert={certificate} isPro={isProfessional} dc={dc} dateStr={dateStr} corners={corners} />
        </div>
      </div>

      {/* Visible preview */}
      <div style={{ width: "100%", aspectRatio: "1122/794", borderRadius: 8, overflow: "hidden", border: "1px solid #374151" }}>
        <div style={{ transform: "scale(0.35)", transformOrigin: "top left", width: "286%", height: "286%" }}>
          <CertInner cert={certificate} isPro={isProfessional} dc={dc} dateStr={dateStr} corners={corners} />
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={generating}
        className="w-full mt-4 px-4 py-3 font-bold rounded-lg transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-500/25 disabled:opacity-50"
      >
        {generating ? "Generating PDF..." : "Download Certificate PDF"}
      </button>
    </div>
  )
}

function CertInner({ cert, isPro, dc, dateStr, corners }) {
  return (
    <div style={{
      width: 1122, height: 794, position: "relative", overflow: "hidden",
      fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif",
      background: "linear-gradient(135deg, #0a0e1a 0%, #111827 40%, #0f172a 70%, #0a0e1a 100%)",
      color: "#e0e0e0",
    }}>
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Glowing orbs */}
      <Orb size={300} color="rgba(34,197,94,0.15)" top={-80} right={120} blur={40} />
      <Orb size={250} color="rgba(59,130,246,0.12)" bottom={-60} left={100} blur={40} />
      <Orb size={200} color="rgba(201,168,76,0.1)" top="50%" left={-40} blur={30} />
      <Orb size={180} color="rgba(234,179,8,0.08)" top="20%" right={-30} blur={25} />

      {/* Border frames */}
      <div style={{ position: "absolute", inset: 16, border: "2px solid rgba(201,168,76,0.4)", borderRadius: 4 }} />
      <div style={{ position: "absolute", inset: 22, border: "1px solid rgba(201,168,76,0.15)", borderRadius: 2 }} />

      {/* Corner accents */}
      {corners.map((s, i) => <div key={i} style={{ position: "absolute", width: 40, height: 40, ...s }} />)}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "50px 60px", textAlign: "center" }}>
        {/* Shield + Brand */}
        <ShieldIcon />
        <div style={{ fontSize: 13, letterSpacing: 6, textTransform: "uppercase", color: "#c9a84c", fontWeight: 600 }}>CyberShield</div>
        <div style={{ fontSize: isPro ? 28 : 32, fontWeight: 700, color: "#fff", marginTop: 4, letterSpacing: 2 }}>
          {isPro ? "Professional Certification" : "Certificate of Achievement"}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>
          OWASP Top 10 Security Training
        </div>

        {/* Divider */}
        <div style={{ width: 100, height: 2, background: "linear-gradient(90deg,transparent,#c9a84c,transparent)", margin: "12px 0" }} />

        {/* Recipient */}
        <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Awarded To</div>
        <div style={{ fontSize: isPro ? 28 : 34, fontWeight: 700, color: isPro ? "#c9a84c" : "#22c55e", textShadow: `0 0 30px ${isPro ? "rgba(201,168,76,0.3)" : "rgba(34,197,94,0.3)"}` }}>
          {cert?.user_name || "CyberShield User"}
        </div>
        <div style={{ width: 260, height: 1, background: `linear-gradient(90deg,transparent,${isPro ? "#c9a84c" : "#22c55e"},transparent)`, margin: "4px 0 12px" }} />

        {/* Professional badge */}
        {isPro && (
          <div style={{
            display: "inline-block", padding: "6px 28px", marginBottom: 10,
            background: "linear-gradient(135deg, #c9a84c, #f5d98e, #c9a84c)",
            color: "#0a0e1a", fontSize: 12, fontWeight: 800, letterSpacing: 3,
            textTransform: "uppercase", borderRadius: 2,
          }}>
            You Are Now A Cybersecurity Professional
          </div>
        )}

        {/* Body text */}
        <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.8, maxWidth: 600 }}>
          {isPro ? (
            <>Has successfully completed <strong style={{ color: "#c9a84c" }}>all 15 OWASP vulnerability categories</strong><br />
            across the CyberShield security training program,<br />
            demonstrating comprehensive knowledge in offensive and defensive security.</>
          ) : (
            <>For successfully completing the<br />
            <strong style={{ color: "#3b82f6" }}>{cert?.vulnerability_type || "OWASP Security Training"}</strong> lab<br />
            at <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: dc.bg, color: dc.text, border: `1px solid ${dc.glow}40` }}>{cert?.difficulty || "Intermediate"}</span> difficulty level</>
          )}
        </div>

        <div style={{ width: 100, height: 2, background: "linear-gradient(90deg,transparent,#c9a84c,transparent)", margin: "12px 0" }} />

        {/* Stats */}
        <div style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.8 }}>
          <strong style={{ color: "#c9a84c" }}>Score:</strong> {cert?.score || 0}% &nbsp;&#8226;&nbsp;
          <strong style={{ color: "#c9a84c" }}>Labs Completed:</strong> {cert?.labs_completed || 0}{cert?.total_labs ? ` / ${cert.total_labs}` : ""}
          <br />
          <strong style={{ color: "#c9a84c" }}>OWASP Category:</strong> {cert?.owasp_category || "A03:2021 - Injection"}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: 2 }}>Certificate ID: {cert?.certificate_id || "N/A"}</div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Issued: {dateStr}</div>
          <div style={{ fontSize: 9, color: "#4b5563", marginTop: 4, letterSpacing: 1 }}>OWASP Top 10 (2021) Security Training Program</div>
        </div>
      </div>

      {/* Seal */}
      <div style={{
        position: "absolute", bottom: 50, right: 60,
        width: 72, height: 72, borderRadius: "50%",
        border: "2px solid #c9a84c", display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", opacity: 0.7,
      }}>
        <LockIcon />
        <div style={{ fontSize: 6, color: "#c9a84c", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Verified</div>
      </div>

      {/* QR block */}
      <div style={{ position: "absolute", bottom: 55, left: 60, display: "grid", gridTemplateColumns: "repeat(5,7px)", gap: 2, opacity: 0.3 }}>
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} style={{ width: 7, height: 7, background: "#c9a84c", opacity: i % 2 === 0 ? 1 : 0.4 }} />
        ))}
      </div>
    </div>
  )
}

function Orb({ size, color, top, left, right, bottom, blur }) {
  return (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle, ${color}, transparent 70%)`,
      top, left, right, bottom, filter: `blur(${blur}px)`, pointerEvents: "none",
    }} />
  )
}

function ShieldIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" stroke="#22c55e" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
