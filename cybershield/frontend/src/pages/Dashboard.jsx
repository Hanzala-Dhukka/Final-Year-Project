import { Link } from "react-router-dom"

function Dashboard() {
  const role = localStorage.getItem("role");

  return (

    <div className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-5xl font-bold mb-10">
        CyberShield Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        <Link to="/security-analyzer">

          <div className="bg-white p-8 rounded shadow hover:shadow-xl transition">

            <h2 className="text-2xl font-bold">
              Security Analyzer
            </h2>

            <p className="mt-4 text-gray-600">
              Analyze website security headers
            </p>

          </div>

        </Link>

        <Link to="/scan-history">

          <div className="bg-white p-8 rounded shadow hover:shadow-xl transition">

            <h2 className="text-2xl font-bold">
              Scan History
            </h2>

            <p className="mt-4 text-gray-600">
              View previous website scans
            </p>

          </div>

        </Link>

        <Link to="/github-scanner">

          <div className="bg-white p-8 rounded shadow hover:shadow-xl transition">

            <h2 className="text-2xl font-bold">
              GitHub Scanner
            </h2>

            <p className="mt-4 text-gray-600">
              Scan repositories for vulnerabilities
            </p>

          </div>

        </Link>

        <Link to="/github-history">

          <div className="bg-white p-8 rounded shadow hover:shadow-xl transition">

            <h2 className="text-2xl font-bold">
              GitHub History
            </h2>

            <p className="mt-4 text-gray-600">
              View repository scan history
            </p>

          </div>

        </Link>

        <Link to="/analytics">

          <div className="bg-white p-8 rounded shadow hover:shadow-xl transition">

            <h2 className="text-2xl font-bold">
              Analytics Dashboard
            </h2>

            <p className="mt-4 text-gray-600">
              View security analytics and charts
            </p>

          </div>

        </Link>

        <Link to="/report-center">

          <div className="bg-white p-8 rounded shadow hover:shadow-xl transition">

            <h2 className="text-2xl font-bold">
              Report Center
            </h2>

            <p className="mt-4 text-gray-600">
              Generate and view security reports
            </p>

          </div>

        </Link>

        <Link to="/owasp-simulator">

          <div className="bg-white p-8 rounded shadow hover:shadow-xl transition">

            <h2 className="text-2xl font-bold">
              OWASP Simulator
            </h2>

            <p className="mt-4 text-gray-600">
              Simulate common web vulnerabilities
            </p>

          </div>

        </Link>

        {role === "admin" && (
          <Link to="/admin">
            <div className="bg-white p-8 rounded shadow border-2 border-black hover:shadow-xl transition">
              <h2 className="text-2xl font-bold text-red-600">
                Admin Dashboard
              </h2>
              <p className="mt-4 text-gray-600">
                Manage users and system settings
              </p>
            </div>
          </Link>
        )}

        <button
          onClick={() => {

            localStorage.removeItem("token")
            localStorage.removeItem("role")

            window.location.href = "/login"
          }}
        >

          <div className="bg-red-500 text-white p-8 rounded shadow hover:bg-red-600 transition">

            <h2 className="text-2xl font-bold">
              Logout
            </h2>

            <p className="mt-4">
              Securely logout from dashboard
            </p>

          </div>

        </button>

      </div>

    </div>
  )
}

export default Dashboard
