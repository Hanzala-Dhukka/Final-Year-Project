import { useLocation, Link } from "react-router-dom"
import API from "../../api/api"

function SecurityReport() {
  const location = useLocation()
  const { result } = location.state || {}

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-100 p-10">
        <div className="mb-8">
          <Link to="/threat-modeling" className="text-blue-600 hover:underline">
            &larr; Back to Threat Modeling
          </Link>
          <h1 className="text-4xl font-bold mt-4">Security Report</h1>
        </div>
        <div className="bg-white p-8 rounded shadow max-w-3xl mx-auto">
          <p className="text-gray-600">No security report data available. Please create a threat model first.</p>
        </div>
      </div>
    )
  }

  const { project_id, project, threats_found, overall_risk, average_score, risk_summary, top_risks, threats, recommendations, fix_plan, security_report } = result

  const handleDownloadPDF = async () => {
    try {
      const response = await API.get(`/threat-model/report/${project_id}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${project}_Threat_Report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Failed to download PDF report")
    }
  }

  const handlePreviewPDF = async () => {
    try {
      const response = await API.get(`/report/${project_id}/preview`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (error) {
      console.error("Error previewing PDF:", error)
      alert("Failed to preview PDF report")
    }
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "P1":
        return "text-red-600 bg-red-50 border-red-200"
      case "P2":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "P3":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "P4":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  // Get risk level dot
  const getRiskLevelDot = (level) => {
    switch (level) {
      case "Critical":
        return "🔴"
      case "High":
        return "🟠"
      case "Medium":
        return "🟡"
      case "Low":
        return "🟢"
      default:
        return "⚪"
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="mb-8">
        <Link to="/threat-modeling" className="text-blue-600 hover:underline">
          &larr; Back to Threat Modeling
        </Link>
        <h1 className="text-4xl font-bold mt-4">Security Report</h1>
        <p className="text-gray-600 mt-2">
          Security fix plan for project: <strong>{project}</strong>
        </p>
      </div>

      {/* Executive Summary */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
        <p className="text-gray-700">{security_report.executive_summary}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Threats Found</h3>
          <p className="text-3xl font-bold text-gray-800">{threats_found}</p>
        </div>
        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Overall Risk</h3>
          <p className="text-3xl font-bold">
            <span className="mr-2">{getRiskLevelDot(overall_risk)}</span>
            {overall_risk}
          </p>
        </div>
        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Avg Score</h3>
          <p className="text-3xl font-bold text-gray-800">{average_score}</p>
        </div>
        <div className="bg-red-50 p-6 rounded shadow text-center border border-red-200">
          <h3 className="text-sm font-semibold text-red-600 mb-2">Critical</h3>
          <p className="text-3xl font-bold text-red-800">{risk_summary.critical}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded shadow text-center border border-orange-200">
          <h3 className="text-sm font-semibold text-orange-600 mb-2">High</h3>
          <p className="text-3xl font-bold text-orange-800">{risk_summary.high}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded shadow text-center border border-yellow-200">
          <h3 className="text-sm font-semibold text-yellow-600 mb-2">Medium</h3>
          <p className="text-3xl font-bold text-yellow-800">{risk_summary.medium}</p>
        </div>
        <div className="bg-green-50 p-6 rounded shadow text-center border border-green-200">
          <h3 className="text-sm font-semibold text-green-600 mb-2">Low</h3>
          <p className="text-3xl font-bold text-green-800">{risk_summary.low}</p>
        </div>
      </div>

      {/* Top 5 Highest Risk Threats */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Top 5 Highest Risk Threats</h2>
        <div className="space-y-2">
          {top_risks.map((risk, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
              <span className="font-bold text-lg mr-3">{index + 1}.</span>
              <span className="font-medium">{risk.threat}</span>
              <span className="ml-auto font-bold text-lg">{risk.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fix Plan */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Fix Priority List</h2>
        <div className="space-y-2">
          {fix_plan.map((item, index) => (
            <div key={index} className={`p-3 rounded border ${getPriorityColor(item.priority)}`}>
              <span className="font-bold mr-2">{item.priority}:</span>
              {item.action}
            </div>
          ))}
        </div>
      </div>

      {/* Threat → Fix Mapping Table */}
      <div className="bg-white rounded shadow overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Threat</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fix</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec, index) => (
              <tr key={rec.threat_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 text-sm text-gray-800">{rec.threat}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    rec.severity === "Critical" ? "bg-red-100 text-red-800" :
                    rec.severity === "High" ? "bg-orange-100 text-orange-800" :
                    rec.severity === "Medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {rec.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{rec.recommendation}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`font-bold ${getPriorityColor(rec.fix_priority).split(' ')[0]}`}>
                    {rec.fix_priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Code Suggestions Panel */}
      <div className="bg-gray-900 text-gray-100 p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4 text-white">Code Suggestions</h2>
        <div className="space-y-4">
          {recommendations.slice(0, 3).map((rec, index) => (
            <div key={index}>
              <p className="text-sm font-semibold text-gray-400 mb-2">{rec.threat}:</p>
              <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-sm">
                <code className="text-green-400">{rec.code_example}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Fix Guide */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Step-by-Step Fix Guide</h2>
        <div className="space-y-4">
          {recommendations.slice(0, 3).map((rec, index) => (
            <details key={index} className="border rounded-lg">
              <summary className="p-4 cursor-pointer font-semibold bg-gray-50">
                {rec.threat} - {rec.fix_priority}
              </summary>
              <div className="p-4 border-t">
                <ol className="list-decimal list-inside space-y-2">
                  {rec.implementation_steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Download Report Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleDownloadPDF}
          className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          ⬇ Download PDF Report
        </button>
        <button
          onClick={handlePreviewPDF}
          className="px-8 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Preview Report
        </button>
      </div>
    </div>
  )
}

export default SecurityReport
