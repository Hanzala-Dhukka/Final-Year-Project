import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import API from "../../api/api"

function AIAssistant() {
  const location = useLocation()
  const { result } = location.state || {}
  const [project_id, setProject_id] = useState(result?.project_id || "")
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiProvider, setAiProvider] = useState("Loading...")

  // Suggested questions
  const suggestedQuestions = [
    "What is SQL Injection?",
    "Explain JWT",
    "Why is my project High Risk?",
    "How to fix XSS?",
    "Explain Rate Limiting",
    "Show my Critical Threats",
    "How do I secure AWS?",
    "Explain CSP"
  ]

  // Check AI health on mount
  useEffect(() => {
    checkAIHealth()
  }, [])

  const checkAIHealth = async () => {
    try {
      const response = await API.get("/chatbot/health")
      setAiProvider(response.data.provider)
    } catch (error) {
      setAiProvider("Rule-Based (Fallback)")
    }
  }

  const handleAsk = async (q) => {
    const questionText = q || question
    if (!questionText.trim()) return

    setLoading(true)
    setQuestion("")

    // Add user message
    setMessages(prev => [...prev, { type: "user", text: questionText }])

    try {
      const response = await API.post("/chatbot/ask", {
        project_id,
        question: questionText
      })

      // Add AI response with new format
      setMessages(prev => [...prev, { 
        type: "ai", 
        data: response.data.answer,
        provider: response.data.provider,
        model: response.data.model,
        response_time: response.data.response_time,
        source: response.data.provider
      }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: "ai", 
        data: {
          title: "Error",
          summary: "Sorry, I couldn't process your question. Please try again.",
          business_impact: "N/A",
          recommendation: "Please try again or contact support.",
          implementation_steps: [],
          secure_code: ""
        },
        provider: "Error",
        source: "Error"
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedClick = (q) => {
    setQuestion(q)
    handleAsk(q)
  }

  // Render AI response with structured format
  const renderAIResponse = (msg) => {
    const data = msg.data || {}
    
    return (
      <div className="max-w-3xl">
        {/* AI Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            🤖 {msg.provider || 'AI'}
          </span>
          {msg.model && (
            <span className="text-xs text-gray-500">{msg.model}</span>
          )}
          {msg.response_time && (
            <span className="text-xs text-gray-400">({msg.response_time}s)</span>
          )}
        </div>

        {/* Response Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Title */}
          {data.title && (
            <h3 className="text-lg font-bold text-gray-900 mb-2">{data.title}</h3>
          )}

          {/* Summary */}
          {data.summary && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Summary:</p>
              <p className="text-gray-800 whitespace-pre-wrap">{data.summary}</p>
            </div>
          )}

          {/* Business Impact */}
          {data.business_impact && data.business_impact !== "See summary" && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3">
              <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Business Impact:</p>
              <p className="text-sm text-red-700">{data.business_impact}</p>
            </div>
          )}

          {/* Recommendation */}
          {data.recommendation && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-green-700 mb-1">✓ Recommendation:</p>
              <p className="text-gray-800">{data.recommendation}</p>
            </div>
          )}

          {/* Implementation Steps */}
          {data.implementation_steps && data.implementation_steps.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Implementation Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                {data.implementation_steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-700">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Secure Code */}
          {data.secure_code && (
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-700 mb-2">Secure Code Example:</p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                <pre className="text-sm">
                  <code>{data.secure_code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="mb-8">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold mt-4">AI Security Assistant</h1>
        <p className="text-gray-600 mt-2">
          Ask questions about your security threats and get AI-powered recommendations
        </p>
        <div className="mt-2">
          <span className="text-xs font-semibold text-gray-600">
            AI Provider: <span className="text-blue-600">{aiProvider}</span>
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded shadow mb-4 p-4 h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-32">
              <p className="text-2xl mb-2">🤖 Ask me anything about security!</p>
              <p className="text-sm mt-2">Try: "How do I fix XSS?" or "What is SQL Injection?"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-3xl ${
                    msg.type === "user" 
                      ? "bg-blue-600 text-white p-3 rounded-lg" 
                      : ""
                  }`}>
                    {msg.type === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      renderAIResponse(msg)
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-gray-500">🤖 Gemini is thinking...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a security question..."
              className="flex-1 border rounded px-4 py-2"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Ask
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Suggested Questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedClick(q)}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant