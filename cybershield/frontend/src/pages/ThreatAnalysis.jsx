import { useLocation, Link } from "react-router-dom"

function ThreatAnalysis() {
  const location = useLocation()
  const { result } = location.state || {}

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-100 p-10">
        <div className="mb-8">
          <Link to="/threat-modeling" className="text-blue-600 hover:underline">
            &larr; Back to Threat Modeling
          </Link>
          <h1 className="text-4xl font-bold mt-4">Threat Analysis</h1>
        </div>
        <div className="bg-white p-8 rounded shadow max-w-3xl mx-auto">
          <p className="text-gray-600">No threat analysis data available. Please create a threat model first.</p>
        </div>
      </div>
    )
  }

  const { project, threats_found, risk_level, threats } = result

  // Calculate severity counts
  const severityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  }

  threats.forEach((threat) => {
    if (severityCounts.hasOwnProperty(threat.severity)) {
      severityCounts[threat.severity]++
    }
  })

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get severity dot color
  const getSeverityDot = (severity) => {
    switch (severity) {
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
        <h1 className="text-4xl font-bold mt-4">Threat Analysis</h1>
        <p className="text-gray-600 mt-2">
          Security threats identified for project: <strong>{project}</strong>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Threats Found</h3>
          <p className="text-3xl font-bold text-gray-800">{threats_found}</p>
        </div>
        <div className="bg-red-50 p-6 rounded shadow text-center border border-red-200">
          <h3 className="text-sm font-semibold text-red-600 mb-2">Critical</h3>
          <p className="text-3xl font-bold text-red-800">{severityCounts.Critical}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded shadow text-center border border-orange-200">
          <h3 className="text-sm font-semibold text-orange-600 mb-2">High</h3>
          <p className="text-3xl font-bold text-orange-800">{severityCounts.High}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded shadow text-center border border-yellow-200">
          <h3 className="text-sm font-semibold text-yellow-600 mb-2">Medium</h3>
          <p className="text-3xl font-bold text-yellow-800">{severityCounts.Medium}</p>
        </div>
        <div className="bg-green-50 p-6 rounded shadow text-center border border-green-200">
          <h3 className="text-sm font-semibold text-green-600 mb-2">Low</h3>
          <p className="text-3xl font-bold text-green-800">{severityCounts.Low}</p>
        </div>
      </div>

      {/* Risk Level Banner */}
      <div className={`p-4 rounded-lg mb-6 text-center ${getSeverityColor(risk_level)}`}>
        <span className="text-2xl mr-2">{getSeverityDot(risk_level)}</span>
        <span className="text-xl font-bold">Overall Risk Level: {risk_level}</span>
      </div>

      {/* Threats Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Threat ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Technology</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Threat</th>
            </tr>
          </thead>
          <tbody>
            {threats.map((threat, index) => (
              <tr key={threat.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 text-sm font-mono text-gray-800">{threat.id}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{threat.technology}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{threat.category}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                    <span className="mr-1">{getSeverityDot(threat.severity)}</span>
                    {threat.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{threat.threat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ThreatAnalysis