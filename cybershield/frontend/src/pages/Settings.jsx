import { useState, useEffect } from "react"
import API from "../api/api"

function Settings() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await API.get("/auth/sessions")
      setSessions(response.data.sessions || [])
    } catch (error) {
      setError("Failed to load sessions")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutSession = async (sessionId) => {
    try {
      await API.delete(`/auth/sessions/${sessionId}`)
      setSessions(sessions.filter(s => s.id !== sessionId))
      alert("Session closed successfully")
    } catch (error) {
      alert("Failed to close session")
      console.error(error)
    }
  }

  const handleLogoutAll = async () => {
    try {
      await API.post("/auth/logout")
      setSessions([])
      alert("All sessions closed successfully")
    } catch (error) {
      alert("Failed to close all sessions")
      console.error(error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
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
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Active Sessions Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Active Sessions</h2>
          {sessions.length > 1 && (
            <button
              onClick={handleLogoutAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout All Devices
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <p className="text-gray-500">No active sessions</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {session.device || "Unknown Device"}
                    </h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Active
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📍 {session.location || "Unknown Location"}</p>
                    <p>🌐 IP: {session.ip_address || "Unknown"}</p>
                    <p>🕒 Last active: {formatDate(session.last_activity)}</p>
                    <p>🔑 Logged in: {formatDate(session.login_time)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleLogoutSession(session.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-4"
                >
                  Logout
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Security Information</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Access tokens expire after 15 minutes</li>
          <li>• Refresh tokens expire after 7 days</li>
          <li>• Sessions automatically expire after 30 minutes of inactivity</li>
          <li>• You can logout from specific devices or all devices</li>
          <li>• Monitor your active sessions regularly for security</li>
        </ul>
      </div>
    </div>
  )
}

export default Settings