import { useState } from "react"
import API from "../api/api"

function OwaspSimulator() {
  const [attackType, setAttackType] = useState("sqli")
  const [payload, setPayload] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const attackOptions = [
    { value: "sqli", label: "SQL Injection", endpoint: "owasp/simulate/sqli" },
    { value: "xss", label: "XSS", endpoint: "owasp/simulate/xss" },
    { value: "cmdi", label: "Command Injection", endpoint: "owasp/simulate/cmdi" },
    { value: "path-traversal", label: "Path Traversal", endpoint: "owasp/simulate/path-traversal" },
  ]

  const handleRunSimulation = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const selectedOption = attackOptions.find(opt => opt.value === attackType)

    try {
      const response = await API.post(
        `${selectedOption.endpoint}?payload=${encodeURIComponent(payload)}`
      )
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || "An error occurred during simulation")
    } finally {
      setLoading(false)
    }
  }

  const getSeverity = (score) => {
    if (score >= 9.0) return "Critical";
    if (score >= 7.0) return "High";
    if (score >= 4.0) return "Medium";
    if (score > 0) return "Low";
    return "Secure";
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical": return "bg-red-600 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-yellow-500 text-black";
      case "Low": return "bg-blue-500 text-white";
      default: return "bg-green-500 text-white";
    }
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black mb-2">OWASP Attack Simulator</h1>
      <p className="text-gray-500 mb-8">
        Learn how different web vulnerabilities work by simulating attacks in a safe environment.
      </p>

      <div className="space-y-6 p-8 bg-white border rounded-2xl shadow-sm mb-10">
        <div>
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Select Attack Type
          </label>
          <select
            value={attackType}
            onChange={(e) => setAttackType(e.target.value)}
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-gray-50"
          >
            {attackOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
            Enter Payload
          </label>
          <textarea
            rows="4"
            placeholder="Enter attack payload (e.g. ' OR 1=1 --)"
            className="w-full border p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm bg-gray-50"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading || !payload}
          className={`w-full py-4 text-white font-black rounded-xl transition-all uppercase tracking-widest ${
            loading || !payload ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-800 shadow-lg active:scale-[0.98]"
          }`}
        >
          {loading ? "Simulating..." : "Run Simulation"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl mb-6">
          <p className="font-bold">Simulation Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`p-8 rounded-2xl border ${result.success || result.status === "Vulnerable Detected" ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black mb-1">
                  Simulation Result
                </h2>
                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                    result.status === "Vulnerable Detected" ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                  }`}>
                    {result.status}
                  </span>
                  {result.risk_score !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${getSeverityColor(getSeverity(result.risk_score))}`}>
                      {getSeverity(result.risk_score)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Attack Type</h3>
                  <p className="text-lg font-bold text-gray-800">{result.attack || result.vulnerability}</p>
                </div>

                {result.impact && (
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Impact</h3>
                    <p className="text-lg font-bold text-red-600">{result.impact}</p>
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Analysis</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{result.analysis}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-green-600 p-6 rounded-xl shadow-md text-white">
                  <h3 className="text-xs font-black text-green-200 uppercase tracking-widest mb-3">Prevention Guidance</h3>
                  <p className="text-lg font-medium leading-relaxed italic">
                    "{result.prevention || "Always sanitize user inputs and use security best practices."}"
                  </p>
                </div>

                {result.risk_score !== undefined && (
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Severity Score</h3>
                    <div className="text-5xl font-black text-gray-800">
                      {result.risk_score}<span className="text-gray-300 text-2xl">/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OwaspSimulator
