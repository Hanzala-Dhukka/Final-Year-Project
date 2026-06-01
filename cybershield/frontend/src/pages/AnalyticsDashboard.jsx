import { useEffect, useState } from "react"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"

import API from "../api/api"

function AnalyticsDashboard() {

  const [stats, setStats] = useState(null)
  const [recentScans, setRecentScans] = useState([])

  useEffect(() => {

    const fetchStats = async () => {

      try {

        const response = await API.get(
          "analytics/dashboard-stats"
        )

        setStats(response.data)

        const recentResponse = await API.get(
          "analytics/recent-scans"
        )

        setRecentScans(recentResponse.data)

      } catch (error) {

        console.log(error)
      }
    }

    fetchStats()

  }, [])

  if (!stats) {

    return (
      <div className="p-10">
        Loading Dashboard...
      </div>
    )
  }

  const pieData = [
    {
      name: "Critical",
      value: stats.critical
    },
    {
      name: "High",
      value: stats.high
    },
    {
      name: "Medium",
      value: stats.medium
    }
  ]

  const barData = [
    {
      name: "Critical",
      value: stats.critical
    },
    {
      name: "High",
      value: stats.high
    },
    {
      name: "Medium",
      value: stats.medium
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-4xl font-bold mb-10">
        Security Analytics Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <div className="bg-white p-6 rounded shadow">

          <h2 className="text-xl font-bold">
            Total Scans
          </h2>

          <p className="text-4xl mt-4">
            {stats.total_scans}
          </p>

        </div>

        <div className="bg-white p-6 rounded shadow">

          <h2 className="text-xl font-bold">
            Vulnerabilities
          </h2>

          <p className="text-4xl mt-4">
            {stats.total_vulnerabilities}
          </p>

        </div>

        <div className="bg-white p-6 rounded shadow">

          <h2 className="text-xl font-bold">
            Critical Issues
          </h2>

          <p className="text-4xl mt-4 text-red-600">
            {stats.critical}
          </p>

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        <div className="bg-white p-6 rounded shadow">

          <h2 className="text-2xl font-bold mb-6">
            Risk Distribution
          </h2>

          <PieChart width={400} height={300}>

            <Pie
              data={pieData}
              dataKey="value"
              outerRadius={100}
              label
            >

              <Cell fill="#dc2626" />
              <Cell fill="#f97316" />
              <Cell fill="#eab308" />

            </Pie>

            <Tooltip />

          </PieChart>

        </div>

        <div className="bg-white p-6 rounded shadow">

          <h2 className="text-2xl font-bold mb-6">
            Severity Overview
          </h2>

          <BarChart
            width={500}
            height={300}
            data={barData}
          >

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar dataKey="value" fill="#2563eb" />

          </BarChart>

        </div>

      </div>

      <div className="bg-white p-6 rounded shadow mt-10">

        <h2 className="text-2xl font-bold mb-6">
          Recent Scan Activity
        </h2>

        <div className="space-y-4">

          {recentScans.map((scan) => (

            <div
              key={scan._id}
              className="border p-4 rounded"
            >

              <h3 className="font-bold text-lg">
                {scan.repository}
              </h3>

              <p className="mt-2">
                Vulnerabilities:
                <span className="ml-2 font-bold">
                  {scan.vulnerabilities_found}
                </span>
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}

export default AnalyticsDashboard
