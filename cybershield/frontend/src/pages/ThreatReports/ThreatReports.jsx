import { useEffect, useState } from "react"
import API from "../../api/api"

export default function ThreatReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await API.get("/threat/reports")
      setReports(response.data)
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Threat Reports</h1>
      
      {reports.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600">No reports generated yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{report.title || "Untitled Report"}</h3>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(report.risk)}`}>
                  {report.risk || "Unknown"}
                </span>
                {report.created && (
                  <span className="text-sm text-gray-500">
                    {new Date(report.created).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getRiskColor(risk) {
  switch (risk?.toLowerCase()) {
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
