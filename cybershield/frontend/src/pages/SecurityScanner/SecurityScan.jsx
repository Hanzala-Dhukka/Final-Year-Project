import { useState, useEffect } from "react"
import ScanForm from "../../components/Common/ScanForm"
import ScanProgress from "../../components/Common/ScanProgress"
import RiskCard from "../../components/Cards/RiskCard"
import VulnerabilityCard from "../../components/Cards/VulnerabilityCard"
import AIReport from "../../components/Common/AIReport"
import ScanHistory from "../../components/Common/ScanHistory"
import { startScan, createWebSocketConnection } from "../../services/scanService"

export default function SecurityScan() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("Initializing...")
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState("")
  const [currentScanId, setCurrentScanId] = useState(null)
  const [ws, setWs] = useState(null)

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [ws])

  const handleScanStart = async (repoUrl) => {
    setLoading(true)
    setProgress(0)
    setStage("Initializing...")
    setScanResult(null)
    setError("")

    try {
      const result = await startScan(repoUrl)
      const scanId = result.scan_id
      setCurrentScanId(scanId)

      // Connect to WebSocket for real-time updates
      const websocket = createWebSocketConnection(
        scanId,
        (data) => {
          // On message
          if (data.percentage) {
            setProgress(data.percentage)
          }
          if (data.current_stage) {
            setStage(data.current_stage)
          }
          if (data.status === "completed") {
            setLoading(false)
            setProgress(100)
            setStage("Complete!")
            // Fetch results
            fetchScanResults(scanId)
          }
          if (data.status === "failed") {
            setLoading(false)
            setError(data.current_stage || "Scan failed")
          }
        },
        (error) => {
          console.error("WebSocket error:", error)
        },
        () => {
          console.log("WebSocket closed")
        }
      )

      setWs(websocket)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to scan repository. Please try again.")
      setLoading(false)
    }
  }

  const fetchScanResults = async (scanId) => {
    try {
      // Import dynamically to avoid circular dependency
const { getScanResults } = await import("../../services/scanService")
      const result = await getScanResults(scanId)
      setScanResult(result)
    } catch (err) {
      console.error("Error fetching results:", err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Scanner</h1>

      <ScanForm onScanStart={handleScanStart} loading={loading} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <ScanProgress loading={loading} progress={progress} stage={stage} />

      {scanResult && (
        <>
          <RiskCard
            riskScore={scanResult.risk_score || 0}
            filesScanned={scanResult.files_scanned || 0}
            issuesFound={scanResult.findings?.length || 0}
          />

          {scanResult.findings && scanResult.findings.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Vulnerabilities Found</h3>
              {scanResult.findings.map((finding, index) => (
                <VulnerabilityCard key={index} {...finding} />
              ))}
            </div>
          )}

          {scanResult.ai_report && <AIReport aiReport={scanResult.ai_report} />}

          {scanResult.pdf_url && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <button
                onClick={() => window.open(scanResult.pdf_url, "_blank")}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Download PDF Report
              </button>
            </div>
          )}
        </>
      )}

      <ScanHistory />
    </div>
  )
}
