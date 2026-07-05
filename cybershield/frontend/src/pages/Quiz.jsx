import { useState, useEffect } from "react"
import API from "../api/api"

function Quiz() {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(localStorage.getItem("quiz_session_id"))
  const [showFilter, setShowFilter] = useState("all")
  const [history, setHistory] = useState([])

  useEffect(() => {
    initQuiz()
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await API.get("quiz/history")
      setHistory(res.data)
    } catch (err) {
      console.error("Error fetching quiz history:", err)
    }
  }

  const initQuiz = async () => {
    try {
      setLoading(true)
      let currentSessionId = sessionId
      
      // If no session exists, start a new one
      if (!currentSessionId) {
        const startRes = await API.post("quiz/start")
        currentSessionId = startRes.data.session_id
        setSessionId(currentSessionId)
        localStorage.setItem("quiz_session_id", currentSessionId)
      }
      
      // Fetch questions for the current session
      const questionsRes = await API.get(`quiz/questions/${currentSessionId}`)
      setQuestions(questionsRes.data)
      setLoading(false)
    } catch (err) {
      console.error("Error initializing quiz:", err)
      // If session is invalid, clear it and retry once
      if (err.response && err.response.status === 404) {
        localStorage.removeItem("quiz_session_id")
        setSessionId(null)
        // Auto retry starting a new session
        const startRes = await API.post("quiz/start")
        const newSessionId = startRes.data.session_id
        setSessionId(newSessionId)
        localStorage.setItem("quiz_session_id", newSessionId)
        const questionsRes = await API.get(`quiz/questions/${newSessionId}`)
        setQuestions(questionsRes.data)
        setLoading(false)
      } else {
        setError("Failed to load quiz. Please try again later.")
        setLoading(false)
      }
    }
  }

  const handleOptionChange = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await API.post("quiz/submit", { 
        session_id: sessionId,
        answers 
      })
      setResult(res.data)
      localStorage.removeItem("quiz_session_id")
      setSessionId(null)
      fetchHistory()
    } catch (err) {
      console.error("Error submitting quiz:", err)
      alert("Error submitting quiz. Please try again.")
    }
  }

  const renderHistoryReview = () => {
    if (!history || history.length === 0) return null;

    const totalAttempts = history.length;
    
    const improveAttempts = history.map((item, idx) => ({
      ...item,
      attemptNumber: totalAttempts - idx
    })).filter(item => item.score < item.total);

    return (
      <div className="mt-12 bg-white p-8 rounded shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Quiz History Review</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">Current history:</h3>
            <div className="space-y-4">
              {history.map((item, idx) => {
                const attemptNum = totalAttempts - idx;
                return (
                  <div key={item._id || idx} className="p-4 bg-gray-50 rounded border">
                    <p className="font-bold text-gray-800 text-lg">Attempt #{attemptNum}</p>
                    <p className="text-gray-600">Score: {item.score}/{item.total}</p>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">Improve:</h3>
            <div className="space-y-4">
              {improveAttempts.map((item) => (
                <div key={item._id} className="p-4 bg-yellow-50 rounded border border-yellow-200 flex flex-col justify-between sm:flex-row sm:items-center">
                  <div className="mb-3 sm:mb-0">
                    <p className="font-bold text-gray-800 text-lg">Attempt #{item.attemptNumber}</p>
                    <p className="text-gray-600">Score: {item.score}/{item.total}</p>
                  </div>
                  <button
                    onClick={() => {
                      setResult(item);
                      setShowFilter("all");
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition text-sm cursor-pointer"
                  >
                    View Review
                  </button>
                </div>
              ))}
              {improveAttempts.length === 0 && (
                <p className="text-gray-500 italic">No attempts need improvement!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-2xl">Loading Quiz...</div>
  if (error) return <div className="p-10 text-center text-red-500 text-2xl">{error}</div>

  if (result) {
    return (
      <div className="min-h-screen bg-gray-100 p-10 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white p-10 rounded shadow-lg text-center mb-10">
            <h1 className="text-4xl font-bold mb-8">Quiz Results</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Score</h2>
                <p className="text-4xl font-extrabold text-blue-600">
                  {result.score} / {result.total}
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Percentage</h2>
                <p className="text-4xl font-extrabold text-green-600">
                  {result.percentage}%
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Correct</h2>
                <p className="text-4xl font-extrabold text-green-600">
                  {result.correct}
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Incorrect</h2>
                <p className="text-4xl font-extrabold text-red-600">
                  {result.incorrect}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setResult(null)
                setAnswers({})
                setShowFilter("all")
                initQuiz()
              }}
              className="bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-xl hover:bg-blue-700 transition"
            >
              Try New Quiz
            </button>
          </div>

          <div className="bg-white p-6 rounded shadow-md mb-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-8">
            <span className="font-bold text-gray-700 text-lg">Show:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="showFilter"
                value="all"
                checked={showFilter === "all"}
                onChange={() => setShowFilter("all")}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-gray-700 font-semibold">All Questions</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="showFilter"
                value="wrong"
                checked={showFilter === "wrong"}
                onChange={() => setShowFilter("wrong")}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-gray-700 font-semibold">Wrong Questions Only</span>
            </label>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Review Answers</h2>
            {result.results && result.results
              .filter(resultItem => showFilter === "all" || !resultItem.is_correct)
              .map((resultItem, index) => (
              <div key={index} className={`p-6 rounded-lg shadow-md border-l-8 hover:shadow-lg transition-shadow duration-200 ${resultItem.is_correct ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <div className="mb-4">
                  <span className="font-semibold block text-gray-500 text-xs uppercase tracking-wider mb-1">Question:</span>
                  <p className="text-lg text-gray-900 font-bold">{resultItem.question}</p>
                </div>

                <div className="mb-4">
                  <span className="font-semibold block text-gray-500 text-xs uppercase tracking-wider mb-1">Your Answer:</span>
                  <p className={`text-base font-bold ${resultItem.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                    {resultItem.user_answer || "Not Answered"}
                  </p>
                </div>

                <div className="mb-4">
                  <span className="font-semibold block text-gray-500 text-xs uppercase tracking-wider mb-1">Correct Answer:</span>
                  <p className="text-base font-bold text-green-700">
                    {resultItem.correct_answer}
                  </p>
                </div>

                <div className="mb-4">
                  <span className="font-semibold block text-gray-500 text-xs uppercase tracking-wider mb-1">Result:</span>
                  <p className="text-base font-bold">
                    {resultItem.is_correct ? '✅ Correct' : '❌ Incorrect'}
                  </p>
                </div>

                {resultItem.explanation && (
                  <div className="mt-4 p-4 bg-white rounded-md border border-gray-200">
                    <span className="font-semibold block text-gray-500 text-xs uppercase tracking-wider mb-1">Explanation:</span>
                    <p className="text-gray-700 leading-relaxed">{resultItem.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {renderHistoryReview()}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-10 text-center">Security Quiz</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white p-8 rounded shadow">
              <h2 className="text-2xl font-bold mb-6">
                {index + 1}. {q.question}
              </h2>
              <div className="space-y-4">
                {q.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-3 p-3 rounded hover:bg-gray-50 cursor-pointer transition"
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() => handleOptionChange(q.id, option)}
                      className="h-5 w-5 text-blue-600"
                      required
                    />
                    <span className="text-lg text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-12 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              Submit Quiz
            </button>
          </div>
        </form>
        {renderHistoryReview()}
      </div>
    </div>
  )
}

export default Quiz
