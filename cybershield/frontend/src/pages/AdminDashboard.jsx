import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  adminGetDashboard,
  adminGetAllUsers,
  adminSearchUsers,
  adminChangeUserRole,
  adminChangeUserStatus,
  adminDeleteUser,
  adminGetUserActivity,
  adminGetStatistics,
  adminGetSecurityMonitoring,
  adminGetRecentActivities
} from "../api/api";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [securityMonitoring, setSecurityMonitoring] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      const response = await adminGetDashboard();
      const data = response.data;
      setDashboardData(data);
      setStatistics(data.statistics);
      setSecurityMonitoring(data.security_monitoring);
      setRecentActivities(data.recent_activities);
      setUsers(data.recent_users || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch dashboard data");
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await adminGetAllUsers(0, 100);
      setUsers(response.data.users);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch users");
      setLoading(false);
    }
  };

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchUsers();
      return;
    }

    try {
      const response = await adminSearchUsers(searchQuery);
      setUsers(response.data.users);
    } catch (err) {
      alert(err.response?.data?.detail || "Search failed");
    }
  };

  // Change user role
  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    try {
      await adminChangeUserRole(userId, newRole);
      alert("Role updated successfully");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update role");
    }
  };

  // Change user status
  const handleChangeStatus = async (userId, newStatus) => {
    if (!window.confirm(`Change account status to ${newStatus}?`)) return;

    try {
      await adminChangeUserStatus(userId, newStatus);
      alert(`Account ${newStatus} successfully`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    }
  };

  // Delete user
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      await adminDeleteUser(userId);
      alert("User deleted successfully");
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user");
    }
  };

  // View user activity
  const viewUserActivity = async (userId) => {
    try {
      const response = await adminGetUserActivity(userId);
      setUserActivity(response.data);
      setSelectedUser(userId);
      setActiveTab("user-activity");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to fetch user activity");
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "statistics") {
      adminGetStatistics().then(res => setStatistics(res.data)).catch(() => setLoading(false));
    } else if (activeTab === "security") {
      adminGetSecurityMonitoring().then(res => setSecurityMonitoring(res.data)).catch(() => setLoading(false));
    } else if (activeTab === "activities") {
      adminGetRecentActivities(50).then(res => setRecentActivities(res.data.activities)).catch(() => setLoading(false));
    }
  }, [activeTab]);

  if (loading && activeTab === "dashboard") return <div className="p-10 text-center text-2xl">Loading dashboard...</div>;
  if (error && activeTab === "dashboard") return <div className="p-10 text-center text-red-500 text-2xl">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold text-gray-800">CyberShield Admin</h1>
        <button 
          onClick={() => navigate("/dashboard")}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-6 py-3 font-semibold ${activeTab === "dashboard" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-600"}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 font-semibold ${activeTab === "users" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-600"}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("statistics")}
          className={`px-6 py-3 font-semibold ${activeTab === "statistics" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-600"}`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-6 py-3 font-semibold ${activeTab === "security" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-600"}`}
        >
          Security Monitoring
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`px-6 py-3 font-semibold ${activeTab === "activities" ? "border-b-4 border-blue-500 text-blue-600" : "text-gray-600"}`}
        >
          Activities
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && dashboardData && (
        <div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Users</h3>
              <p className="text-4xl font-bold text-blue-600">{statistics?.total_users || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Scans</h3>
              <p className="text-4xl font-bold text-green-600">{statistics?.total_scans || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">Threats Found</h3>
              <p className="text-4xl font-bold text-red-600">{statistics?.critical_issues || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">Active Users</h3>
              <p className="text-4xl font-bold text-purple-600">{statistics?.active_users || 0}</p>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Recent Activities</h2>
            <div className="space-y-3">
              {recentActivities.slice(0, 10).map((activity, index) => (
                <div key={index} className="border-b pb-2">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{activity.username}</span> - {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          {/* Search Bar */}
          <div className="mb-6 flex gap-4">
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={fetchUsers}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Reset
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 
                        user.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewUserActivity(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Activity
                      </button>
                      <select
                        onChange={(e) => e.target.value && handleChangeStatus(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        defaultValue=""
                      >
                        <option value="" disabled>Change Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "statistics" && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">User Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Total Users:</span>
                <span className="font-semibold">{statistics.total_users}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Active Users:</span>
                <span className="font-semibold text-green-600">{statistics.active_users}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Inactive Users:</span>
                <span className="font-semibold text-red-600">{statistics.inactive_users}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Activity Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Total Scans:</span>
                <span className="font-semibold">{statistics.total_scans}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">GitHub Scans:</span>
                <span className="font-semibold">{statistics.github_scans}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Security Scans:</span>
                <span className="font-semibold">{statistics.security_scans}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Quiz Attempts:</span>
                <span className="font-semibold">{statistics.quiz_attempts}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">OWASP Attempts:</span>
                <span className="font-semibold">{statistics.owasp_attempts}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Security Issues</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Critical Issues:</span>
                <span className="font-semibold text-red-600">{statistics.critical_issues}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">High Issues:</span>
                <span className="font-semibold text-orange-600">{statistics.high_issues}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Monitoring Tab */}
      {activeTab === "security" && securityMonitoring && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">GitHub Scanner</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Total Scans:</span>
                <span className="font-semibold">{securityMonitoring.github_scanner.total_scans}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Critical Issues:</span>
                <span className="font-semibold text-red-600">{securityMonitoring.github_scanner.critical_issues}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">High Issues:</span>
                <span className="font-semibold text-orange-600">{securityMonitoring.github_scanner.high_issues}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">Security Scanner</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Websites Checked:</span>
                <span className="font-semibold">{securityMonitoring.security_scanner.websites_checked}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Critical Alerts:</span>
                <span className="font-semibold text-red-600">{securityMonitoring.security_scanner.critical_alerts}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 text-purple-600">OWASP Simulator</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Total Attempts:</span>
                <span className="font-semibold">{securityMonitoring.owasp_simulator.total_attempts}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">SQL Injection:</span>
                <span className="font-semibold text-red-600">{securityMonitoring.owasp_simulator.sql_injection_attempts}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">XSS Attempts:</span>
                <span className="font-semibold text-orange-600">{securityMonitoring.owasp_simulator.xss_attempts}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === "activities" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activities</h2>
          <div className="space-y-3 max-h-screen overflow-y-auto">
            {recentActivities.map((activity, index) => (
              <div key={index} className="border-b pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{activity.username}</span> - {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Module: {activity.module} | Action: {activity.action}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    activity.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Activity Tab */}
      {activeTab === "user-activity" && userActivity && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">User Activity: {userActivity.full_name}</h2>
            <button
              onClick={() => setActiveTab("users")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Users
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-gray-600 text-sm font-semibold">Repository Scans</h3>
              <p className="text-3xl font-bold text-blue-600">{userActivity.github_scans}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-gray-600 text-sm font-semibold">Security Scans</h3>
              <p className="text-3xl font-bold text-green-600">{userActivity.security_scans}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-gray-600 text-sm font-semibold">Quiz Attempts</h3>
              <p className="text-3xl font-bold text-purple-600">{userActivity.quiz_attempts}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-gray-600 text-sm font-semibold">OWASP Labs</h3>
              <p className="text-3xl font-bold text-orange-600">{userActivity.owasp_attempts}</p>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-gray-600">Total Activities: <span className="font-semibold">{userActivity.total_activities}</span></p>
            <p className="text-gray-600">Last Login: <span className="font-semibold">{userActivity.last_login ? new Date(userActivity.last_login).toLocaleString() : 'Never'}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;