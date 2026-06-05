import { useState, useEffect } from "react";
import API from "../api/api";

function MonitoringDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, targetsRes] = await Promise.all([
        API.get("monitoring/alerts"),
        API.get("monitoring/targets"),
      ]);

      setAlerts(alertsRes.data);
      setTargets(targetsRes.data);

      // Calculate stats
      const newStats = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      alertsRes.data.forEach((alert) => {
        if (newStats[alert.severity] !== undefined) {
          newStats[alert.severity]++;
        }
      });
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-600 text-white";
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-black";
      case "Low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-semibold">Loading Monitoring Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Monitoring Dashboard</h1>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
          >
            Refresh Data
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {Object.entries(stats).map(([severity, count]) => (
            <div key={severity} className="bg-white rounded-lg shadow p-6 border-l-4 border-l-gray-300 flex flex-col items-center justify-center">
              <span className={`text-xs font-bold px-2 py-1 rounded mb-2 ${getSeverityColor(severity)}`}>
                {severity.toUpperCase()}
              </span>
              <span className="text-3xl font-bold">{count}</span>
              <span className="text-gray-500 text-sm mt-1">Total Alerts</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Alerts Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-800 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold">Recent Alerts</h2>
                <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                  {alerts.length} Records
                </span>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 italic">
                    No security alerts found.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert._id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{alert.title}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm mb-2">
                        Target: <span className="font-mono bg-gray-100 px-1 rounded">{alert.target}</span>
                      </div>
                      <div className="text-gray-400 text-xs flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Monitoring Targets Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-700 text-white">
                <h2 className="text-xl font-bold">Monitoring Targets</h2>
              </div>
              <div className="p-4 divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {targets.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 italic">
                    No targets configured.
                  </div>
                ) : (
                  targets.map((target) => (
                    <div key={target._id} className="py-3 flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase">
                          {target.type}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${target.enabled ? 'bg-green-500' : 'bg-gray-300'}`} title={target.enabled ? 'Active' : 'Disabled'}></span>
                      </div>
                      <span className="text-sm font-mono truncate text-gray-700" title={target.target}>
                        {target.target}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">
                        Added: {new Date(target.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitoringDashboard;
