import { useEffect, useState } from "react"
import API from "../../api/api"

export default function Quiz() {
  const [quizData, setQuizData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizProgress()
  }, [])

  const fetchQuizProgress = async () => {
    try {
      const response = await API.get("/quiz/progress")
      setQuizData(response.data)
    } catch (error) {
      console.error("Error fetching quiz progress:", error)
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quiz Performance</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Your Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">
              {quizData?.attempts || 0}
            </div>
            <p className="text-gray-600 mt-2">Total Attempts</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {quizData?.average || 0}%
            </div>
            <p className="text-gray-600 mt-2">Average Score</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {quizData?.rank || "Beginner"}
            </div>
            <p className="text-gray-600 mt-2">Current Rank</p>
          </div>
        </div>
      </div>
    </div>
  )
}
