import { useEffect, useState } from "react"
import { gamificationApi } from "../../api/gamificationApi"
import CertificateTemplate from "../../components/Gamification/CertificateTemplate"

const VULN_TYPES = [
  "SQL Injection", "XSS", "Command Injection", "Path Traversal",
  "Broken Authentication", "CSRF", "SSRF", "IDOR", "File Upload",
  "XXE", "Security Misconfiguration", "Insecure Deserialization",
  "JWT Attacks", "API Security", "Rate Limiting",
]

export default function Certificate() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [proEligible, setProEligible] = useState(false)
  const [generating, setGenerating] = useState(null)

  useEffect(() => { fetchCerts(); checkPro() }, [])

  const fetchCerts = async () => {
    try {
      const r = await gamificationApi.allCertificates()
      setCertificates(r.data.certificates || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const checkPro = async () => {
    try {
      const r = await gamificationApi.checkProfessionalCert()
      setProEligible(r.data.eligible)
    } catch (e) { console.error(e) }
  }

  const genPro = async () => {
    setGenerating("pro")
    try { await gamificationApi.generateProfessionalCert(); await fetchCerts() }
    catch (e) { console.error(e) } finally { setGenerating(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-xl text-gray-400 animate-pulse">Loading certificates...</div>
    </div>
  )

  const catCerts = certificates.filter(c => c.type === "category" || (!c.type && c.course && !c.course.includes("Professional")))
  const proCerts = certificates.filter(c => c.type === "professional" || (c.course && c.course.includes("Professional")))

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
          <p className="text-gray-400">OWASP Top 10 Security Training Certificates</p>
        </div>

        {/* Professional */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
              <span className="text-2xl">&#x1f3c6;</span> Professional Certification
            </h2>
            {proEligible && proCerts.length === 0 && (
              <button onClick={genPro} disabled={generating === "pro"}
                className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 transition-all shadow-lg shadow-yellow-500/25">
                {generating === "pro" ? "Generating..." : "Generate Professional Certificate"}
              </button>
            )}
          </div>

          {proCerts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proCerts.map(c => (
                <CertificateTemplate key={c.certificate_id} certificate={c} type="professional" />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <div className="text-5xl mb-4">&#x1f393;</div>
              <p className="text-gray-300 text-lg mb-2">
                {proEligible ? "Congratulations! You are eligible for the Professional Certificate." : "Complete all 15 OWASP vulnerability categories to earn this certificate."}
              </p>
              {!proEligible && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {VULN_TYPES.map(v => (
                    <span key={v} className="text-xs bg-gray-900/80 text-gray-500 rounded-full px-3 py-1">{v}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Category certs */}
        <section>
          <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
            <span className="text-2xl">&#x1f512;</span> Category Certificates
          </h2>

          {catCerts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {catCerts.map(c => (
                <CertificateTemplate key={c.certificate_id} certificate={c} type="category" />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8">
              <p className="text-gray-400 text-center mb-4">
                No category certificates yet. Complete all labs of a vulnerability type to earn its certificate.
              </p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {VULN_TYPES.map(v => (
                  <div key={v} className="text-xs text-gray-500 bg-gray-900/50 rounded-lg px-2 py-2 text-center">{v}</div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
