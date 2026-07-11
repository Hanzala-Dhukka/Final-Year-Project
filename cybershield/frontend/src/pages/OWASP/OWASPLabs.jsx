import { useEffect, useState } from "react"
import API from "../api/api"

export default function OWASPLabs() {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await API.get("/labs/progress")
      setProgress(response.data)
    } catch (error) {
      console.error("Error fetching lab progress:", error)
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">OWASP Labs</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Your Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold">
                {progress?.completed || 0} / {progress?.total || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-indigo-600 h-4 rounded-full transition-all"
                style={{ width: `${progress?.percentage || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-indigo-600">
              {progress?.percentage || 0}%
            </span>
            <p className="text-gray-600">Complete</p>
          </div>
        </div>
      </div>
    </div>
  )
}
