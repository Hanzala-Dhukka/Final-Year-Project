import { useEffect, useState } from "react"
import API from "../../api/api"

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenge()
  }, [])

  const fetchChallenge = async () => {
    try {
      const response = await API.get("/challenges/today")
      setChallenge(response.data)
    } catch (error) {
      console.error("Error fetching daily challenge:", error)
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Daily Challenge</h1>
      
      {!challenge ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600">No challenge available today.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-semibold">{challenge.title || "Today's Challenge"}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
              {challenge.difficulty || "Medium"}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  {challenge.xp || 0}
                </div>
                <p className="text-sm text-gray-600">XP Reward</p>
              </div>
              {challenge.expires && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {challenge.expires}
                  </div>
                  <p className="text-sm text-gray-600">Time Left</p>
                </div>
              )}
            </div>
            
            <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors">
              Start Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function getDifficultyColor(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "hard":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
