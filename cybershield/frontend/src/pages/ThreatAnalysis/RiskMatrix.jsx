import { useLocation, Link } from "react-router-dom"

function RiskMatrix() {
  const location = useLocation()
  const { result } = location.state || {}

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-100 p-10">
        <div className="mb-8">
          <Link to="/threat-modeling" className="text-blue-600 hover:underline">
            &larr; Back to Threat Modeling
          </Link>
          <h1 className="text-4xl font-bold mt-4">Risk Matrix</h1>
        </div>
        <div className="bg-white p-8 rounded shadow max-w-3xl mx-auto">
          <p className="text-gray-600">No risk matrix data available. Please create a threat model first.</p>
        </div>
      </div>
    )
  }

  const { project, threats_found, overall_risk, average_score, risk_summary, top_risks, threats } = result

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

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "P1":
        return "text-red-600"
      case "P2":
        return "text-orange-600"
      case "P3":
        return "text-yellow-600"
      case "P4":
        return "text-green-600"
      default:
        return "text-gray-600"
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

  // Generate matrix data
  const matrixData = {}
  for (let x = 1; x <= 5; x++) {
    for (let y = 1; y <= 5; y++) {
      matrixData[`${x}-${y}`] = []
    }
  }

  threats.forEach((threat) => {
    const key = `${threat.likelihood}-${threat.impact_score}`
    if (matrixData[key]) {
      matrixData[key].push(threat)
    }
  })

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="mb-8">
        <Link to="/threat-modeling" className="text-blue-600 hover:underline">
          &larr; Back to Threat Modeling
        </Link>
        <h1 className="text-4xl font-bold mt-4">Risk Matrix</h1>
        <p className="text-gray-600 mt-2">
          Risk analysis for project: <strong>{project}</strong>
        </p>
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

      {/* Risk Matrix Visualization */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Risk Matrix</h2>
        <div className="flex flex-col items-center">
          <div className="mb-2">
            <span className="text-sm font-semibold text-gray-600">Impact</span>
          </div>
          <div className="flex">
            <div className="flex flex-col mr-2">
              {[5, 4, 3, 2, 1].map((y) => (
                <div key={y} className="h-16 w-12 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {y}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[5, 4, 3, 2, 1].map((y) => (
                <div key={y} className="grid grid-rows-5 gap-1">
                  {[1, 2, 3, 4, 5].map((x) => {
                    const threatsInCell = matrixData[`${x}-${y}`] || []
                    const hasThreats = threatsInCell.length > 0
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`h-12 w-12 border rounded flex items-center justify-center text-xs font-bold ${
                          hasThreats ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400"
                        }`}
                        title={hasThreats ? `${threatsInCell.length} threat(s)` : ""}
                      >
                        {hasThreats ? threatsInCell.length : ""}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 ml-14">
            <span className="text-sm font-semibold text-gray-600">Likelihood: 1 2 3 4 5</span>
          </div>
        </div>
      </div>

      {/* Top 5 Highest Risk Threats */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Top 5 Highest Risk Threats</h2>
        <div className="space-y-2">
          {top_risks.map((risk, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">{index + 1}. {risk.threat}</span>
              <span className="font-bold text-lg">{risk.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Threats Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Threat ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Threat</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Likelihood</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Impact</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
            </tr>
          </thead>
          <tbody>
            {threats.map((threat, index) => (
              <tr key={threat.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 text-sm font-mono text-gray-800">{threat.id}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{threat.threat}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{threat.likelihood} ({threat.likelihood_label})</td>
                <td className="px-4 py-3 text-sm text-gray-800">{threat.impact_score} ({threat.impact_label})</td>
                <td className="px-4 py-3 text-sm font-bold">{threat.risk_score}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`font-bold ${getPriorityColor(threat.priority)}`}>
                    {threat.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RiskMatrix