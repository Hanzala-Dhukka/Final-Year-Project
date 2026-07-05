import { useState, useEffect } from "react"
import API from "../api/api"

function Glossary() {
  const [terms, setTerms] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTerms, setFilteredTerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTerms()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const searchResults = terms.filter(
        (item) =>
          item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.definition.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredTerms(searchResults)
    } else {
      setFilteredTerms(terms)
    }
  }, [searchTerm, terms])

  const fetchTerms = async () => {
    try {
      setLoading(true)
      const res = await API.get("glossary")
      setTerms(res.data)
      setFilteredTerms(res.data)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching glossary terms:", err)
      setError("Failed to load glossary. Please try again later.")
      setLoading(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-2xl">Loading Glossary...</div>
  if (error) return <div className="p-10 text-center text-red-500 text-2xl">{error}</div>

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-10 text-center">Security Glossary</h1>
        
        <div className="mb-10">
          <input
            type="text"
            placeholder="Search Term..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 rounded-lg shadow border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-lg"
          />
        </div>

        <div className="space-y-6">
          {filteredTerms.length > 0 ? (
            filteredTerms.map((item, index) => (
              <div key={index} className="bg-white p-8 rounded shadow">
                <h2 className="text-3xl font-bold text-blue-700 mb-4">
                  {item.term}
                </h2>
                <p className="text-xl text-gray-700 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded shadow text-center">
              <p className="text-2xl text-gray-500">
                No terms found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Glossary
