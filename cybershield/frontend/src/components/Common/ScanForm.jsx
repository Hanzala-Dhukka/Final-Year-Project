import { useState } from "react"

export default function ScanForm({ onScanStart, loading }) {
  const [repoUrl, setRepoUrl] = useState("")
  const [error, setError] = useState("")

  const validateUrl = (url) => {
    const pattern = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/
    return pattern.test(url)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL")
      return
    }

    if (!validateUrl(repoUrl)) {
      setError("Invalid GitHub URL. Format: https://github.com/user/repo")
      return
    }

    onScanStart(repoUrl)
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4">CyberShield Security Scanner</h2>
      <p className="text-gray-600 mb-6">
        Analyze your repository for secrets, dangerous functions, OWASP issues, and security risks.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository URL
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value)
              setError("")
            }}
            placeholder="https://github.com/OWASP/WebGoat"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Scanning..." : "Start Security Scan"}
        </button>
      </form>
    </div>
  )
}