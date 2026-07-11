export default function RiskCard({ riskScore, filesScanned, issuesFound }) {
  const getRiskLevel = (score) => {
    if (score <= 30) return { level: "LOW", color: "text-green-600", bg: "bg-green-100" }
    if (score <= 70) return { level: "MEDIUM", color: "text-yellow-600", bg: "bg-yellow-100" }
    return { level: "CRITICAL", color: "text-red-600", bg: "bg-red-100" }
  }

  const risk = getRiskLevel(riskScore)

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Security Score</h3>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className={`text-5xl font-bold ${risk.color}`}>
            {riskScore}/100
          </div>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${risk.bg} ${risk.color}`}>
            {risk.level}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-indigo-600">{filesScanned || 0}</div>
          <p className="text-sm text-gray-600 mt-1">Files Scanned</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{issuesFound || 0}</div>
          <p className="text-sm text-gray-600 mt-1">Issues Found</p>
        </div>
      </div>
    </div>
  )
}