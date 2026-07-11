import { useEffect, useState } from "react"
import API from "../../api/api"

export default function Glossary() {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await API.get("/glossary/progress")
      setProgress(response.data)
    } catch (error) {
      console.error("Error fetching glossary progress:", error)
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Glossary</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Learning Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Terms Learned</span>
              <span className="font-semibold">
                {progress?.terms_learned || 0} / {progress?.total_terms || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all"
                style={{ 
                  width: `${progress?.total_terms ? (progress.terms_learned / progress.total_terms) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-3xl font-bold text-green-600">
              {progress?.terms_learned || 0}
            </span>
            <p className="text-gray-600 mt-2">
              out of {progress?.total_terms || 0} terms completed
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
