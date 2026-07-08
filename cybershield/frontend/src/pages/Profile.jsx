import { useState, useEffect } from "react"
import API from "../api/api"

function Profile() {
  const [profile, setProfile] = useState(null)
  const [settings, setSettings] = useState(null)
  const [statistics, setStatistics] = useState({})
  const [securityScore, setSecurityScore] = useState(null)
  const [loginHistory, setLoginHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const [profileRes, activityRes, scoreRes] = await Promise.all([
        API.get("/profile"),
        API.get("/profile/activity"),
        API.get("/profile/security-score")
      ])
      
      setProfile(profileRes.data)
      setSettings(profileRes.data.settings)
      setStatistics(profileRes.data.statistics)
      setLoginHistory(activityRes.data.recent_logins || [])
      setSecurityScore(scoreRes.data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      await API.put("/profile/update", {
        full_name: profile.profile?.full_name || profile.username,
        bio: profile.profile?.bio || "",
        location: profile.profile?.location || ""
      })
      alert("Profile updated successfully")
    } catch (error) {
      alert("Failed to update profile")
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const oldPassword = e.target.oldPassword.value
    const newPassword = e.target.newPassword.value
    
    try {
      await API.post("/profile/change-password", {
        old_password: oldPassword,
        new_password: newPassword
      })
      alert("Password changed successfully")
      e.target.reset()
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to change password")
    }
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    try {
      await API.put("/profile/settings", {
        theme: e.target.theme.value,
        email_notifications: e.target.emailNotifications.checked,
        security_alerts: e.target.securityAlerts.checked
      })
      alert("Settings updated successfully")
      fetchProfileData()
    } catch (error) {
      alert("Failed to update settings")
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLevel = (score) => {
    if (score >= 80) return "Expert"
    if (score >= 60) return "Advanced"
    if (score >= 40) return "Intermediate"
    return "Beginner"
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
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Profile Header */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {profile?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{profile?.username}</h2>
            <p className="text-gray-600">{profile?.email}</p>
            <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Security Score */}
      {securityScore && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Security Score</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-5xl font-bold ${getScoreColor(securityScore.score)}`}>
                {securityScore.score}/100
              </div>
              <p className="text-gray-600 mt-2">{getScoreLevel(securityScore.score)}</p>
            </div>
            <div className="text-right">
              <div className="space-y-2">
                {Object.entries(securityScore.factors || {}).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="capitalize text-gray-600">{key.replace("_", " ")}: </span>
                    <span className="font-semibold">{value}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {securityScore.recommendations && securityScore.recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">Recommendations:</p>
              <ul className="list-disc list-inside text-sm text-blue-800">
                {securityScore.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-3xl font-bold text-indigo-600">{statistics.xp || 0}</div>
          <div className="text-gray-600">Total XP</div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-3xl font-bold text-green-600">{statistics.level || 1}</div>
          <div className="text-gray-600">Level</div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-600">{statistics.labs_completed || 0}</div>
          <div className="text-gray-600">Labs Completed</div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-3xl font-bold text-purple-600">{statistics.achievements || 0}</div>
          <div className="text-gray-600">Achievements</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {["profile", "settings", "security", "activity"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={profile?.profile?.full_name || profile?.username}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  defaultValue={profile?.profile?.bio || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  defaultValue={profile?.profile?.location || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Update Profile
              </button>
            </form>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <select
                  name="theme"
                  defaultValue={settings?.theme || "light"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    defaultChecked={settings?.email_notifications ?? true}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Email Notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="securityAlerts"
                    defaultChecked={settings?.security_alerts ?? true}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Security Alerts</span>
                </label>
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Update Settings
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Old Password
                </label>
                <input
                  type="password"
                  name="oldPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Change Password
              </button>
            </form>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Login History</h3>
              {loginHistory.length === 0 ? (
                <p className="text-gray-500">No login history available</p>
              ) : (
                <div className="space-y-2">
                  {loginHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">{entry.device}</div>
                        <div className="text-sm text-gray-600">
                          IP: {entry.ip_address}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(entry.login_time).toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          entry.status === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile