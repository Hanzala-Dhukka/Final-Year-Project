import { useEffect, useState } from "react"
import API from "../../api/api"

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await API.get("/users/profile")
      setUser(response.data)
    } catch (error) {
      console.error("Error fetching profile:", error)
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Failed to load profile</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">{user.name || "User"}</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-semibold">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Level:</span>
            <span className="font-semibold">{user.level || 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">XP:</span>
            <span className="font-semibold">{user.xp || 0}</span>
          </div>
          {user.skill && (
            <div className="flex justify-between">
              <span className="text-gray-600">Skill Level:</span>
              <span className="font-semibold">{user.skill}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
