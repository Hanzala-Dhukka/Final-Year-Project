import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import API from "../../api/api"

function AISecurityCopilot() {
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiProvider, setAiProvider] = useState("Loading...")
  const [uploadedFile, setUploadedFile] = useState(null)
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const [showComparePanel, setShowComparePanel] = useState(false)
  const [compareData, setCompareData] = useState(null)
  const messagesEndRef = useRef(null)

  // Suggested questions
  const suggestedQuestions = [
    "Explain the uploaded report",
    "What are the critical vulnerabilities?",
    "How do I fix these issues?",
    "Show me secure code examples",
    "What's the business impact?",
    "Compare with previous report"
  ]

  useEffect(() => {
    checkAIHealth()
    createNewConversation()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const checkAIHealth = async () => {
    try {
      const response = await API.get("/copilot/health")
      setAiProvider(response.data.provider)
    } catch (error) {
      setAiProvider("Rule-Based (Fallback)")
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await API.post("/copilot/conversation", {
        project_id: null,
        user_name: "User"
      })
      const conv = response.data
      setCurrentConversation(conv)
      loadConversations()
    } catch (error) {
      console.error("Error creating conversation:", error)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await API.get("/copilot/conversations")
      setConversations(response.data.conversations || [])
    } catch (error) {
      console.error("Error loading conversations:", error)
    }
  }

  const loadConversationHistory = async (conversationId) => {
    try {
      const response = await API.get(`/copilot/conversation/${conversationId}`)
      setCurrentConversation(response.data)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error("Error loading conversation:", error)
    }
  }

  const handleAsk = async (q) => {
    const questionText = q || question
    if (!questionText.trim() || !currentConversation) return

    setLoading(true)
    setQuestion("")

    // Add user message
    const userMsg = { type: "user", text: questionText, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await API.post("/copilot/ask", {
        conversation_id: currentConversation.conversation_id,
        question: questionText,
        use_context: true
      })

      // Add AI response
      const aiMsg = {
        type: "ai",
        data: response.data.answer,
        suggested_questions: response.data.suggested_questions,
        provider: response.data.metadata?.provider,
        model: response.data.metadata?.model,
        response_time: response.data.metadata?.response_time,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMsg])
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
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || !currentConversation) return

    setUploadedFile(file)
    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("conversation_id", currentConversation.conversation_id)

    try {
      const response = await API.post("/copilot/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      // Add system message about upload
      const uploadMsg = {
        type: "ai",
        data: {
          title: "File Uploaded",
          summary: `I've analyzed your ${response.data.report_type}. ${response.data.summary.summary}`,
          business_impact: "See summary",
          recommendation: "You can now ask questions about this report.",
          implementation_steps: [],
          secure_code: ""
        },
        provider: "System",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, uploadMsg])
      setShowUploadPanel(false)
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    if (!currentConversation) return

    setLoading(true)
    try {
      // In a real implementation, you'd upload two files and compare them
      // For now, we'll show a placeholder
      setCompareData({
        improvement_percentage: 40,
        critical_fixed: 6,
        critical_remaining: 4,
        high_fixed: 5,
        high_remaining: 7,
        medium_fixed: 3,
        medium_remaining: 6,
        summary: "Overall improvement of 40% in security posture. 6 critical vulnerabilities fixed, 4 remaining. Current risk level: High.",
        chart_data: {
          old: { critical: 10, high: 12, medium: 9, total: 31 },
          new: { critical: 4, high: 7, medium: 6, total: 17 },
          improvements: { critical: 6, high: 5, medium: 3 }
        }
      })
      setShowComparePanel(false)
    } catch (error) {
      console.error("Error comparing reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!currentConversation) return

    try {
      const response = await API.get(`/copilot/export/${currentConversation.conversation_id}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `conversation_${currentConversation.conversation_id}.txt`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Error exporting conversation:", error)
    }
  }

  const handleClearMemory = async () => {
    if (!currentConversation) return

    try {
      await API.post(`/copilot/clear/${currentConversation.conversation_id}`)
      setMessages([])
    } catch (error) {
      console.error("Error clearing memory:", error)
    }
  }

  const renderAIResponse = (msg) => {
    const data = msg.data || {}
    
    return (
      <div className="max-w-3xl">
        {/* AI Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">
            🤖 {msg.provider || 'AI Copilot'}
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

          {/* Suggested Questions */}
          {msg.suggested_questions && msg.suggested_questions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold text-gray-700 mb-2">Suggested Questions:</p>
              <div className="flex flex-wrap gap-2">
                {msg.suggested_questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuestion(q)
                      handleAsk(q)
                    }}
                    className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderCompareResults = () => {
    if (!compareData) return null

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Report Comparison Results</h3>
        
        {/* Improvement Percentage */}
        <div className="mb-6 text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {compareData.improvement_percentage}%
          </div>
          <p className="text-gray-600">Overall Improvement</p>
        </div>

        {/* Chart Data */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded">
            <h4 className="font-semibold text-red-800 mb-2">Old Report</h4>
            <div className="space-y-1 text-sm">
              <div>Critical: {compareData.chart_data.old.critical}</div>
              <div>High: {compareData.chart_data.old.high}</div>
              <div>Medium: {compareData.chart_data.old.medium}</div>
              <div className="font-semibold">Total: {compareData.chart_data.old.total}</div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-semibold text-green-800 mb-2">New Report</h4>
            <div className="space-y-1 text-sm">
              <div>Critical: {compareData.chart_data.new.critical}</div>
              <div>High: {compareData.chart_data.new.high}</div>
              <div>Medium: {compareData.chart_data.new.medium}</div>
              <div className="font-semibold">Total: {compareData.chart_data.new.total}</div>
            </div>
          </div>
        </div>

        {/* Improvements */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Improvements:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Critical Fixed:</span>
              <span className="font-bold text-green-600">{compareData.critical_fixed} ({compareData.critical_remaining} remaining)</span>
            </div>
            <div className="flex justify-between">
              <span>High Fixed:</span>
              <span className="font-bold text-green-600">{compareData.high_fixed} ({compareData.high_remaining} remaining)</span>
            </div>
            <div className="flex justify-between">
              <span>Medium Fixed:</span>
              <span className="font-bold text-green-600">{compareData.medium_fixed} ({compareData.medium_remaining} remaining)</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
          <p className="text-sm text-blue-800">{compareData.summary}</p>
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
        <h1 className="text-4xl font-bold mt-4">🤖 CyberShield Copilot</h1>
        <p className="text-gray-600 mt-2">
          Your AI-powered security assistant with memory and file analysis
        </p>
        <div className="mt-2">
          <span className="text-xs font-semibold text-gray-600">
            AI Provider: <span className="text-purple-600">{aiProvider}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
        {/* Conversation Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Conversations</h2>
              <button
                onClick={createNewConversation}
                className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
              >
                + New
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  onClick={() => loadConversationHistory(conv.conversation_id)}
                  className={`p-3 rounded cursor-pointer hover:bg-gray-50 ${
                    currentConversation?.conversation_id === conv.conversation_id
                      ? "bg-purple-50 border border-purple-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-800">
                    {conv.conversation_id}
                  </div>
                  <div className="text-xs text-gray-500">
                    {conv.message_count} messages
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="col-span-9">
          <div className="bg-white rounded shadow">
            {/* Toolbar */}
            <div className="border-b p-4 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUploadPanel(!showUploadPanel)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  📁 Upload Report
                </button>
                <button
                  onClick={() => setShowComparePanel(!showComparePanel)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  📊 Compare Reports
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  📥 Export
                </button>
              </div>
              <button
                onClick={handleClearMemory}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                🗑 Clear Memory
              </button>
            </div>

            {/* Upload Panel */}
            {showUploadPanel && (
              <div className="border-b p-4 bg-blue-50">
                <h3 className="font-semibold mb-2">Upload Security Report</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.json,.txt,.csv,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-sm text-gray-600">
                      Drop report here or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: PDF, JSON, TXT, CSV, MD
                    </p>
                  </label>
                </div>
              </div>
            )}

            {/* Compare Panel */}
            {showComparePanel && (
              <div className="border-b p-4 bg-green-50">
                <h3 className="font-semibold mb-2">Compare Security Reports</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="file"
                    accept=".pdf,.json,.txt,.csv,.md"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    id="old-report"
                  />
                  <input
                    type="file"
                    accept=".pdf,.json,.txt,.csv,.md"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    id="new-report"
                  />
                </div>
                <button
                  onClick={handleCompare}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Compare Reports
                </button>
              </div>
            )}

            {/* Compare Results */}
            {renderCompareResults()}

            {/* Messages */}
            <div className="p-4 h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-32">
                  <p className="text-2xl mb-2">🤖 Start a conversation with your AI Copilot</p>
                  <p className="text-sm mt-2">Upload a report or ask a security question</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-3xl ${
                        msg.type === "user"
                          ? "bg-purple-600 text-white p-3 rounded-lg"
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
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAsk()}
                  placeholder="Ask a security question..."
                  className="flex-1 border rounded px-4 py-2"
                  disabled={!currentConversation}
                />
                <button
                  onClick={() => handleAsk()}
                  disabled={loading || !question.trim() || !currentConversation}
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Ask
                </button>
              </div>

              {/* Suggested Questions */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Suggested Questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => handleAsk(q)}
                      disabled={!currentConversation}
                      className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AISecurityCopilot