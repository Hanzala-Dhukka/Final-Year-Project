import { useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import ScanDashboard from "../../components/GitHubScanner/ScanProgress/ScanDashboard"
import "./ScannerProgress.css"

export default function ScannerProgress() {
  const { id } = useParams()
  const navigate = useNavigate()

  const handleScanComplete = useCallback(() => {
    navigate(`/scanner/results/${id}`)
  }, [navigate, id])

  return (
    <div className="sp-page">
      <ScanDashboard
        scanId={id}
        onScanComplete={handleScanComplete}
      />
    </div>
  )
}
