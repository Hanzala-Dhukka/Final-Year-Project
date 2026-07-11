import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API from "../api/api"

function OWASPDefenseMode() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [scenario, setScenario] = useState(null)
  const [userCode, setUserCode] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [hintLevel, setHintLevel] = useState(1)
  const [hint, setHint] = useState("")

  useEffect(() => {
    loadCategories()
    loadHistory()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await API.get("/owasp/categories")
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await API.get("/owasp/history/anonymous")
      setHistory(response.data.sessions || [])
    } catch (error) {
      console.error("Error loading history:", error)
    }
  }

  const loadScenario = async (category) => {
    setLoading(true)
    setSelectedCategory(category)
    setResult(null)
    setUserCode("")
    setHint("")
    
    try {
      const response = await API.get(`/owasp/scenario/${category}`)
      setScenario(response.data)
    } catch (error) {
      console.error("Error loading scenario:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!scenario || !userCode.trim()) return
    
    setLoading(true)
    
    try {
      const response = await API.post("/owasp/submit", {
        scenario_id: scenario.scenario_id,
        category: scenario.category,
        user_code: userCode,
        user_id: "anonymous"
      })
      
      setResult(response.data)
      loadHistory()
    } catch (error) {
      console.error("Error submitting defense:", error)
      setResult({
        score: 0,
        status: "Failed",
        feedback: "Error submitting code. Please try again.",
        recommendation: "Try again",
        owasp_reference: "N/A",
        best_practices: [],
        secure_code_example: ""
      })
    } finally {
      setLoading(false)
    }
  }

  const loadHint = async () => {
    if (!scenario) return
    
    try {
      const response = await API.get(`/owasp/hint/${scenario.scenario_id}?hint_level=${hintLevel}`)
      setHint(response.data.hint)
      setHintLevel(prev => prev + 1)
    } catch (error) {
      console.error("Error loading hint:", error)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusColor = (status) => {
    if (status === "Passed") return "bg-green-100 text-green-800"
    if (status === "Partial") return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="mb-8">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold mt-4">🛡️ OWASP Defense Mode</h1>
        <p className="text-gray-600 mt-2">
          Learn to secure your code against common vulnerabilities
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
        {/* Left Sidebar - Categories */}
        <div className="col-span-3">
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold mb-4">Attack Categories</h2>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => loadScenario(category)}
                  className={`w-full text-left px-4 py-3 rounded hover:bg-gray-50 ${
                    selectedCategory === category
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="font-semibold text-sm">{category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* History Button */}
          <div className="bg-white rounded shadow p-4 mt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              📊 View History
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {!scenario ? (
            <div className="bg-white rounded shadow p-10 text-center">
              <div className="text-6xl mb-4">🛡️</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Defense Mode</h2>
              <p className="text-gray-600 mb-6">
                Select an OWASP category from the left to start learning how to secure your code.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="border rounded p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-1">Attack Mode</h3>
                  <p className="text-sm text-gray-600">Learn how attacks work</p>
                </div>
                <div className="border rounded p-4 bg-blue-50">
                  <div className="text-3xl mb-2">🛡️</div>
                  <h3 className="font-semibold mb-1">Defense Mode</h3>
                  <p className="text-sm text-gray-600">Learn how to defend</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scenario Card */}
              <div className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {scenario.category}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                        {scenario.difficulty}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {scenario.language}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    📊 History
                  </button>
                </div>

                {/* Vulnerable Code */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-red-700">⚠️ Vulnerable Code</h3>
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {scenario.vulnerable_code}
                    </pre>
                  </div>
                </div>

                {/* Task */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">📝 Task</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-gray-800">
                      Secure this code to prevent <strong>{scenario.category}</strong>.
                      Write your defense code below.
                    </p>
                  </div>
                </div>

                {/* Hints */}
                {hint && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Hint:</strong> {hint}
                    </p>
                  </div>
                )}

                {/* Code Editor */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Your Defense Code:
                  </label>
                  <textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    placeholder="Write your secure code here..."
                    className="w-full h-64 p-4 border rounded font-mono text-sm bg-gray-900 text-gray-100"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !userCode.trim()}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {loading ? "Submitting..." : "✅ Submit Defense"}
                  </button>
                  <button
                    onClick={loadHint}
                    disabled={loading}
                    className="px-6 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    💡 Hint
                  </button>
                  <button
                    onClick={() => {
                      setScenario(null)
                      setResult(null)
                      setUserCode("")
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Next Scenario
                  </button>
                </div>
              </div>

              {/* Result Card */}
              {result && (
                <div className="bg-white rounded shadow p-6">
                  <h3 className="text-2xl font-bold mb-4">Defense Results</h3>
                  
                  {/* Score and Status */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded p-4 text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Score</div>
                    </div>
                    <div className="bg-gray-50 rounded p-4 text-center">
                      <span className={`inline-block px-4 py-2 rounded font-semibold ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                      <div className="text-sm text-gray-600 mt-2">Status</div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Feedback:</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                      <p className="text-gray-800 whitespace-pre-wrap">{result.feedback}</p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  {result.recommendation && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Recommendation:</h4>
                      <div className="bg-green-50 border border-green-200 rounded p-4">
                        <p className="text-gray-800">{result.recommendation}</p>
                      </div>
                    </div>
                  )}

                  {/* OWASP Reference */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">OWASP Reference:</h4>
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <p className="text-sm text-purple-800">{result.owasp_reference}</p>
                    </div>
                  </div>

                  {/* Best Practices */}
                  {result.best_practices && result.best_practices.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Best Practices:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {result.best_practices.map((practice, index) => (
                          <li key={index} className="text-sm text-gray-700">{practice}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Secure Code Example */}
                  {result.secure_code_example && (
                    <div>
                      <h4 className="font-semibold mb-2">Secure Code Example:</h4>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                        <pre className="text-sm whitespace-pre-wrap">{result.secure_code_example}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History Panel */}
              {showHistory && (
                <div className="bg-white rounded shadow p-6">
                  <h3 className="text-xl font-bold mb-4">Your Defense History</h3>
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No sessions yet. Start defending!</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((session, index) => (
                        <div key={index} className="border rounded p-4 flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{session.category}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(session.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(session.score)}`}>
                              {session.score}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(session.status)}`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OWASPDefenseMode