import { FaGithub, FaSync } from "react-icons/fa"
import ScanDashboard from "../../components/GitHubScanner/ScanProgress/ScanDashboard"

export default function Scanning({ repoUrl, scanId, onScanComplete, onCancel }) {
  return (
    <div className="gs-page">
      {/* Repository Header */}
      <div className="gs-repo-header">
        <div className="gs-repo-header-left">
          <div className="gs-repo-icon">
            <FaGithub />
          </div>
          <div>
            <h1 className="gs-repo-name">{repoUrl}</h1>
            <p className="gs-repo-desc">Scan in progress...</p>
          </div>
        </div>
      </div>

      {/* Scanning indicator */}
      <div className="gs-scan-active-banner">
        <FaSync className="gs-spin" />
        <span>Scanning repository for security vulnerabilities...</span>
      </div>

      {/* Real-time Progress Dashboard */}
      <ScanDashboard
        repositoryUrl={repoUrl}
        scanId={scanId}
        onScanComplete={onScanComplete}
      />
    </div>
  )
}
