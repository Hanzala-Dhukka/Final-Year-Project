import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API from "../api/api"

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      // Get current user
      const userRes = await API.get("/auth/me")
      const userId = userRes.data.id
      setUser(userRes.data)

      // Get dashboard data
      const dashboardRes = await API.get(`/dashboard/${userId}`)
      setDashboard(dashboardRes.data)
    } catch (error) {
      console.error("Error fetching dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Failed to load dashboard</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {dashboard.profile?.full_name || dashboard.profile?.username || "User"}!
        </h1>
        <p className="text-gray-600 mt-2">Here's your cybersecurity learning overview</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total XP"
          value={dashboard.profile?.statistics?.xp || 0}
          icon="⭐"
          color="text-yellow-600"
        />
        <StatCard
          title="Level"
          value={dashboard.profile?.statistics?.level || 1}
          icon="🎯"
          color="text-blue-600"
        />
        <StatCard
          title="Labs Completed"
          value={dashboard.labs?.completed || 0}
          icon="🔬"
          color="text-green-600"
        />
        <StatCard
          title="Achievements"
          value={dashboard.achievements?.total || 0}
          icon="🏆"
          color="text-purple-600"
        />
      </div>

      {/* Security Score */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Security Score</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-6xl font-bold ${getScoreColor(dashboard.security_score?.score || 0)}`}>
              {dashboard.security_score?.score || 0}/100
            </div>
            <p className="text-gray-600 mt-2 text-lg">
              Level: {dashboard.security_score?.level || "Beginner"}
            </p>
          </div>
          <div className="text-right">
            <div className="space-y-2">
              {Object.entries(dashboard.security_score?.factors || {}).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="capitalize text-gray-600">{key.replace("_", " ")}: </span>
                  <span className="font-semibold">{value}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {dashboard.security_score?.recommendations && dashboard.security_score.recommendations.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm font-semibold text-blue-900 mb-2">Recommendations:</p>
            <ul className="list-disc list-inside text-sm text-blue-800">
              {dashboard.security_score.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Scans Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Security Scans</h3>
            <Link to="/github-scanner" className="text-indigo-600 hover:text-indigo-800 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Scans</span>
              <span className="text-2xl font-bold text-indigo-600">{dashboard.scans?.total || 0}</span>
            </div>
            {dashboard.scans?.recent && dashboard.scans.recent.length > 0 ? (
              <div className="space-y-2 mt-4">
                {dashboard.scans.recent.map((scan) => (
                  <div key={scan.id} className="border rounded p-3">
                    <div className="font-semibold">{scan.repository}</div>
                    <div className="text-sm text-gray-600">
                      {scan.vulnerabilities} vulnerabilities found
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(scan.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-4">No scans yet. Start your first scan!</p>
            )}
          </div>
        </div>

        {/* Labs Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">OWASP Labs</h3>
            <Link to="/labs" className="text-indigo-600 hover:text-indigo-800 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="text-2xl font-bold text-green-600">
                {dashboard.labs?.completed || 0}
              </span>
            </div>
            {dashboard.labs?.recent && dashboard.labs.recent.length > 0 ? (
              <div className="space-y-2 mt-4">
                {dashboard.labs.recent.map((lab) => (
                  <div key={lab.id} className="border rounded p-3">
                    <div className="font-semibold">{lab.lab_name}</div>
                    <div className="text-sm text-gray-600">{lab.category}</div>
                    <div className="text-xs text-gray-500">
                      Completed: {new Date(lab.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-4">No labs completed yet. Start learning!</p>
            )}
          </div>
        </div>

        {/* Quizzes Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Quiz Performance</h3>
            <Link to="/quiz" className="text-indigo-600 hover:text-indigo-800 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quizzes Completed</span>
              <span className="text-2xl font-bold text-blue-600">
                {dashboard.quizzes?.total_attempts || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Score</span>
              <span className="text-2xl font-bold text-green-600">
                {dashboard.quizzes?.average_score || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Best Score</span>
              <span className="text-2xl font-bold text-purple-600">
                {dashboard.quizzes?.best_score || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Threat Reports Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Threat Reports</h3>
            <Link to="/reports" className="text-indigo-600 hover:text-indigo-800 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Reports</span>
              <span className="text-2xl font-bold text-red-600">
                {dashboard.threat_reports?.total || 0}
              </span>
            </div>
            {dashboard.threat_reports?.recent && dashboard.threat_reports.recent.length > 0 ? (
              <div className="space-y-2 mt-4">
                {dashboard.threat_reports.recent.map((report) => (
                  <div key={report.id} className="border rounded p-3">
                    <div className="font-semibold">{report.title}</div>
                    <div className="text-sm text-gray-600">
                      Severity: <span className={`capitalize ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-4">No reports generated yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Challenge */}
      {dashboard.daily_challenge && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 mb-8">
          <h3 className="text-2xl font-semibold mb-2">Daily Challenge</h3>
          <p className="text-lg mb-4">{dashboard.daily_challenge.title || "Complete your daily challenge!"}</p>
          <Link
            to="/challenges"
            className="inline-block bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
          >
            Start Challenge
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <ActivityItem
            icon="🔬"
            title="Lab Completed"
            description={dashboard.labs?.recent?.[0]?.lab_name || "No recent labs"}
            time={dashboard.labs?.recent?.[0]?.completed_at}
          />
          <ActivityItem
            icon="📝"
            title="Quiz Attempt"
            description={`Score: ${dashboard.quizzes?.recent?.[0]?.score || 0}%`}
            time={dashboard.quizzes?.recent?.[0]?.completed_at}
          />
          <ActivityItem
            icon="💬"
            title="AI Chat Session"
            description={`${dashboard.ai_chat?.recent?.[0]?.messages_count || 0} messages`}
            time={dashboard.ai_chat?.recent?.[0]?.last_activity}
          />
        </div>
      </div>
    </div>
  )
}

// Helper Components
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

function ActivityItem({ icon, title, description, time }) {
  return (
    <div className="flex items-start space-x-3 border-b pb-3 last:border-b-0">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
        {time && (
          <div className="text-xs text-gray-500">
            {new Date(time).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
}

function getScoreColor(score) {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-blue-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

function getSeverityColor(severity) {
  switch (severity) {
    case "critical":
      return "text-red-600 font-bold"
    case "high":
      return "text-orange-600"
    case "medium":
      return "text-yellow-600"
    case "low":
      return "text-green-600"
    default:
      return "text-gray-600"
  }
}

export default Dashboard