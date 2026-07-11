import { useEffect, useState } from "react"
import { getScanHistory } from "../../services/scanService"

export default function ScanHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const data = await getScanHistory()
      setHistory(data)
    } catch (error) {
      console.error("Error fetching scan history:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Previous Scans</h3>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Previous Scans</h3>
        <p className="text-gray-600">No scan history yet. Start your first scan!</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Previous Scans</h3>
      
      <div className="space-y-4">
        {history.map((scan, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{scan.repository || "Unknown Repository"}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(scan.risk)}`}>
                    {scan.risk || "Unknown"}
                  </span>
                  {scan.date && (
                    <span className="text-sm text-gray-500">
                      {new Date(scan.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
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