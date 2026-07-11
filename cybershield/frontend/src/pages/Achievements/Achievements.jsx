import { useEffect, useState } from "react"
import API from "../../api/api"

export default function Achievements() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const response = await API.get("/progress/achievements")
      setAchievements(response.data)
    } catch (error) {
      console.error("Error fetching achievements:", error)
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Achievements</h1>
      
      {achievements.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600">No achievements yet. Keep learning!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🏅</div>
              <h3 className="text-xl font-semibold mb-2">{achievement.name || "Achievement"}</h3>
              {achievement.badge && (
                <p className="text-sm text-gray-500">Badge: {achievement.badge}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
