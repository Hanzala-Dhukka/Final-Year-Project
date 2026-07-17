import { useEffect, useState } from "react"
import API from "../../api/api"

export default function Certificate() {
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCertificate()
  }, [])

  const fetchCertificate = async () => {
    try {
      const userId = localStorage.getItem("user_id") || "anonymous"
      const response = await API.get(`/certificate/${userId}`)
      setCertificate(response.data)
    } catch (error) {
      console.error("Error fetching certificate:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (certificate?.url) {
      window.open(certificate.url, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Certificates</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        {certificate?.available ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-semibold mb-4">Certificate Available!</h2>
            <p className="text-gray-600 mb-6">
              Congratulations! You have earned a certificate.
            </p>
            <button
              onClick={handleDownload}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Download Certificate
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="text-2xl font-semibold mb-4">No Certificate Yet</h2>
            <p className="text-gray-600">
              Complete more courses and challenges to earn your certificate!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
