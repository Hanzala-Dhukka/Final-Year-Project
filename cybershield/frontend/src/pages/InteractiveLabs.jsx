import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API from "../api/api"

function InteractiveLabs() {
  const [labs, setLabs] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [currentLab, setCurrentLab] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [payload, setPayload] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userProgress, setUserProgress] = useState(null)
  const [showProgress, setShowProgress] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [hint, setHint] = useState("")
  const [labState, setLabState] = useState("start") // start, scenario, attack, success, defense, completed

  useEffect(() => {
    loadCategories()
    loadLabs()
    loadProgress()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await API.get("/labs/categories")
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadLabs = async () => {
    try {
      const response = await API.get("/labs")
      setLabs(response.data.labs || [])
    } catch (error) {
      console.error("Error loading labs:", error)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await API.get("/progress/anonymous")
      setUserProgress(response.data)
    } catch (error) {
      console.error("Error loading progress:", error)
    }
  }

  const startLab = async (lab) => {
    setLoading(true)
    setCurrentLab(lab)
    setResult(null)
    setPayload("")
    setHint("")
    setLabState("scenario")
    
    try {
      const response = await API.post(`/lab/start?lab_id=${lab.lab_id}&user_id=anonymous`)
      setSessionId(response.data.session_id)
    } catch (error) {
      console.error("Error starting lab:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitAttack = async () => {
    if (!sessionId || !payload.trim()) return
    
    setLoading(true)
    
    try {
      const response = await API.post("/lab/attack", {
        lab_id: currentLab.lab_id,
        payload: payload,
        user_id: "anonymous"
      })
      
      setResult(response.data)
      setAttempts(prev => prev + 1)
      
      if (response.data.success) {
        setLabState("success")
      } else if (response.data.next_step === "retry" && response.data.attempts_remaining === 0) {
        setLabState("failed")
      }
    } catch (error) {
      console.error("Error submitting attack:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitDefense = async (secureCode) => {
    if (!sessionId || !secureCode.trim()) return
    
    setLoading(true)
    
    try {
      const response = await API.post("/lab/defense", {
        lab_id: currentLab.lab_id,
        secure_code: secureCode,
        user_id: "anonymous"
      })
      
      setResult(response.data)
      
      if (response.data.lab_complete) {
        setLabState("completed")
      }
    } catch (error) {
      console.error("Error submitting defense:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadHint = async () => {
    if (!sessionId) return
    
    try {
      const response = await API.get(`/lab/hint/${sessionId}?attempt_number=${attempts + 1}`)
      setHint(response.data.hint)
    } catch (error) {
      console.error("Error loading hint:", error)
    }
  }

  const getDifficultyColor = (difficulty) => {
    if (difficulty === "Easy") return "bg-green-100 text-green-800"
    if (difficulty === "Medium") return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="mb-8">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold mt-4">🎯 Interactive Attack Labs</h1>
        <p className="text-gray-600 mt-2">
          Practice real-world penetration testing scenarios
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
        {/* Left Sidebar - Categories & Labs */}
        <div className="col-span-3">
          {/* Categories */}
          <div className="bg-white rounded shadow p-4 mb-4">
            <h2 className="text-lg font-bold mb-4">Categories</h2>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className={`w-full text-left px-4 py-2 rounded hover:bg-gray-50 ${
                    selectedCategory === category ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                  }`}
                >
                  <div className="font-semibold text-sm">{category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress Button */}
          <div className="bg-white rounded shadow p-4">
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              📊 My Progress
            </button>
            {userProgress && (
              <div className="mt-4 space-y-2">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{userProgress.total_xp}</div>
                  <div className="text-sm text-gray-600">Total XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProgress.labs_completed}/{userProgress.total_labs}</div>
                  <div className="text-sm text-gray-600">Labs Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userProgress.completion_percentage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {!currentLab ? (
            /* Lab Cards */
            <div className="grid grid-cols-2 gap-4">
              {labs.map((lab) => (
                <div key={lab.lab_id} className="bg-white rounded shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{lab.title}</h3>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${getDifficultyColor(lab.difficulty)}`}>
                          {lab.difficulty}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {lab.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl">🏆</div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{lab.story}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-semibold">XP: </span>
                      <span className="text-yellow-600">{lab.xp_reward}</span>
                    </div>
                    <button
                      onClick={() => startLab(lab)}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Start Lab
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Lab Interface */
            <div className="space-y-4">
              {/* Lab Header */}
              <div className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{currentLab.title}</h2>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${getDifficultyColor(currentLab.difficulty)}`}>
                        {currentLab.difficulty}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {currentLab.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentLab(null)
                      setResult(null)
                      setLabState("start")
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Exit Lab
                  </button>
                </div>

                {/* Story */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                  <h3 className="font-semibold mb-2">📖 Scenario</h3>
                  <p className="text-gray-800">{currentLab.story}</p>
                </div>

                {/* Objective */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <h3 className="font-semibold mb-2">🎯 Objective</h3>
                  <p className="text-gray-800">{currentLab.objective}</p>
                </div>
              </div>

              {/* Vulnerable Code Viewer */}
              <div className="bg-white rounded shadow p-6">
                <h3 className="text-lg font-semibold mb-2 text-red-700">⚠️ Vulnerable Code</h3>
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {currentLab.vulnerable_code}
                  </pre>
                </div>
              </div>

              {/* Attack Phase */}
              {labState === "scenario" || labState === "attack" || labState === "success" ? (
                <div className="bg-white rounded shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">💥 Launch Attack</h3>
                  
                  {/* Hint */}
                  {hint && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>💡 Hint:</strong> {hint}
                      </p>
                    </div>
                  )}

                  {/* Payload Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Your Payload:
                    </label>
                    <textarea
                      value={payload}
                      onChange={(e) => setPayload(e.target.value)}
                      placeholder="Enter your attack payload..."
                      className="w-full h-32 p-4 border rounded font-mono text-sm bg-gray-900 text-gray-100"
                      style={{ fontFamily: 'monospace' }}
                      disabled={labState === "success"}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={submitAttack}
                      disabled={loading || !payload.trim() || labState === "success"}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-semibold"
                    >
                      {loading ? "Attacking..." : "🚀 Launch Attack"}
                    </button>
                    <button
                      onClick={loadHint}
                      disabled={loading || labState === "success"}
                      className="px-6 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      💡 Hint
                    </button>
                  </div>

                  {/* Attempts Counter */}
                  <div className="mt-4 text-sm text-gray-600">
                    Attempts: {attempts} / {currentLab.max_attempts_easy || 10}
                  </div>
                </div>
              ) : null}

              {/* Result Display */}
              {result && (
                <div className="bg-white rounded shadow p-6">
                  <h3 className="text-2xl font-bold mb-4">Attack Result</h3>
                  
                  {/* Server Response */}
                  <div className={`mb-4 p-4 rounded ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <p className="font-semibold mb-2">Server Response:</p>
                    <p className="text-gray-800">{result.server_response}</p>
                  </div>

                  {/* Points Earned */}
                  {result.success && (
                    <div className="mb-4 text-center">
                      <div className="text-4xl font-bold text-yellow-600">+{result.xp_earned} XP</div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-4">
                    <h4 className="font-semibold mb-2">Explanation:</h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{result.explanation}</p>
                  </div>

                  {/* Modified Query */}
                  {result.modified_query && (
                    <div className="mb-4 bg-purple-50 border border-purple-200 rounded p-4">
                      <h4 className="font-semibold mb-2">Modified Query:</h4>
                      <pre className="text-sm text-gray-800 font-mono">{result.modified_query}</pre>
                    </div>
                  )}

                  {/* Defense Challenge */}
                  {result.success && labState === "success" && (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-xl font-bold mb-4">🛡️ Now Fix This Vulnerability</h3>
                      <p className="text-gray-600 mb-4">
                        Write secure code to prevent this vulnerability.
                      </p>
                      <DefenseEditor 
                        category={currentLab.category}
                        onComplete={(defenseResult) => {
                          submitDefense(defenseResult.secure_code)
                        }}
                      />
                    </div>
                  )}

                  {/* Lab Complete */}
                  {result.lab_complete && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded p-6 text-center">
                      <div className="text-4xl mb-4">🎉</div>
                      <h3 className="text-2xl font-bold text-green-800 mb-2">Lab Complete!</h3>
                      <p className="text-green-700 mb-4">
                        Total XP: {result.total_xp}
                      </p>
                      {result.badge_earned && (
                        <div className="inline-block px-4 py-2 bg-yellow-400 text-yellow-900 rounded font-semibold">
                          🏆 Badge Earned: {result.badge_earned}
                        </div>
                      )}
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

// Defense Editor Component
function DefenseEditor({ category, onComplete }) {
  const [secureCode, setSecureCode] = useState("")

  const handleSubmit = () => {
    if (!secureCode.trim()) return
    onComplete({ secure_code: secureCode })
  }

  return (
    <div className="border rounded p-4">
      <label className="block text-sm font-semibold mb-2">
        Your Secure Code:
      </label>
      <textarea
        value={secureCode}
        onChange={(e) => setSecureCode(e.target.value)}
        placeholder="Write your secure code here..."
        className="w-full h-48 p-4 border rounded font-mono text-sm bg-gray-900 text-gray-100 mb-4"
        style={{ fontFamily: 'monospace' }}
      />
      <button
        onClick={handleSubmit}
        disabled={!secureCode.trim()}
        className="w-full px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
      >
        Submit Defense
      </button>
    </div>
  )
}

export default InteractiveLabs