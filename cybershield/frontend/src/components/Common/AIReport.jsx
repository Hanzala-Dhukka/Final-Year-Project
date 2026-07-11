export default function AIReport({ aiReport }) {
  if (!aiReport) return null

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        🤖 AI Security Report
      </h3>

      <div className="space-y-4">
        {aiReport.risk_level && (
          <div>
            <span className="text-gray-600 block mb-2">Risk Level:</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(aiReport.risk_level)}`}>
              {aiReport.risk_level}
            </span>
          </div>
        )}

        {aiReport.summary && (
          <div>
            <span className="text-gray-600 block mb-2">Summary:</span>
            <p className="text-gray-800 bg-gray-50 p-3 rounded">{aiReport.summary}</p>
          </div>
        )}

        {aiReport.recommendations && aiReport.recommendations.length > 0 && (
          <div>
            <span className="text-gray-600 block mb-2">Recommendations:</span>
            <ul className="space-y-2">
              {aiReport.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-800">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function getRiskColor(riskLevel) {
  switch (riskLevel?.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800"
    case "high":
      return "bg-orange-100 text-orange-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "low":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}