import {
  FaFileCode,
  FaExclamationTriangle,
  FaChevronRight,
  FaShieldAlt
} from "react-icons/fa";

import "./FindingsExplorer.css";

export default function FindingsExplorer({
  fileReport = []
}) {
  return (
    <div className="findings-container">
      <h2>
        <FaShieldAlt />
        Security Findings Explorer
      </h2>

      {
        fileReport.length === 0 ?
        <div className="findings-empty">
          No vulnerabilities detected.
        </div>
        :
        fileReport.map((file, index) => (
          <div
            className="finding-card"
            key={index}
          >
            <div className="finding-header">
              <div className="finding-file">
                <FaFileCode />
                <h3>
                  {file.file}
                </h3>
              </div>
            </div>

            {
              file.issues.map((issue, i) => (
                <div
                  className="issue-card"
                  key={i}
                >
                  <div className="issue-top">
                    <div>
                      <h4>
                        {issue.type}
                      </h4>
                    </div>
                    <span
                      className={`severity ${issue.severity?.toLowerCase()}`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <div className="issue-info">
                    <div>
                      <b>Matches</b>
                      <p>
                        {issue.matches_found}
                      </p>
                    </div>
                    <div>
                      <b>Recommendation</b>
                      <p>
                        {issue.recommendation || "Review and remediate this issue"}
                      </p>
                    </div>
                  </div>
                  <button
                    className="details-btn"
                  >
                    View Details
                    <FaChevronRight />
                  </button>
                </div>
              ))
            }
          </div>
        ))
      }
    </div>
  )
}