
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import API from "../api/api"

function ThreatModeling() {
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    frontend: "",
    backend: "",
    database: "",
    authentication: "",
    cloud: "",
    third_party_text: "",
    assets_text: "",
  })
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData({
      project_name: "",
      description: "",
      frontend: "",
      backend: "",
      database: "",
      authentication: "",
      cloud: "",
      third_party_text: "",
      assets_text: "",
    })
    setSuccessMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setSuccessMessage(null)

      // Convert textarea inputs to lists
      const third_party = formData.third_party_text
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const assets = formData.assets_text
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const payload = {
        project_name: formData.project_name,
        description: formData.description,
        frontend: formData.frontend,
        backend: formData.backend,
        database: formData.database,
        authentication: formData.authentication,
        cloud: formData.cloud || undefined,
        third_party,
        assets,
      }

      const response = await API.post("/threat-model/create", payload)
      
      // Navigate to security report page with results
      navigate("/security-report", { state: { result: response.data } })
    } catch (error) {
      console.error("Error creating threat model:", error)
      alert(error.response?.data?.detail || "Failed to create threat model")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="mb-8">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold mt-4">Threat Modeling</h1>
        <p className="text-gray-600 mt-2">
          Describe your project to analyze security threats
        </p>
      </div>

      <div className="bg-white p-8 rounded shadow max-w-3xl mx-auto">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded border border-green-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              className="w-full border rounded px-4 py-3"
              placeholder="e.g. CyberShield"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border rounded px-4 py-3"
              placeholder="Describe your project"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frontend *
              </label>
              <input
                type="text"
                name="frontend"
                value={formData.frontend}
                onChange={handleChange}
                className="w-full border rounded px-4 py-3"
                placeholder="React"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Backend *
              </label>
              <input
                type="text"
                name="backend"
                value={formData.backend}
                onChange={handleChange}
                className="w-full border rounded px-4 py-3"
                placeholder="FastAPI"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Database *
              </label>
              <input
                type="text"
                name="database"
                value={formData.database}
                onChange={handleChange}
                className="w-full border rounded px-4 py-3"
                placeholder="MongoDB"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Authentication *
              </label>
              <input
                type="text"
                name="authentication"
                value={formData.authentication}
                onChange={handleChange}
                className="w-full border rounded px-4 py-3"
                placeholder="JWT"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cloud Provider
            </label>
            <input
              type="text"
              name="cloud"
              value={formData.cloud}
              onChange={handleChange}
              className="w-full border rounded px-4 py-3"
              placeholder="e.g. AWS, Azure, GCP"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Third-party APIs (comma separated)
            </label>
            <textarea
              name="third_party_text"
              value={formData.third_party_text}
              onChange={handleChange}
              rows="2"
              className="w-full border rounded px-4 py-3"
              placeholder="GitHub API, Stripe API"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sensitive Assets (comma separated)
            </label>
            <textarea
              name="assets_text"
              value={formData.assets_text}
              onChange={handleChange}
              rows="2"
              className="w-full border rounded px-4 py-3"
              placeholder="User Accounts, Reports, API Keys"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-3 border rounded hover:bg-gray-50 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Threat Model"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ThreatModeling
