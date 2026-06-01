import { useEffect, useState } from "react" 
import API from "../api/api" 

function ScanHistory() { 

  const [history, setHistory] = useState([]) 
  const [loading, setLoading] = useState(true)

  useEffect(() => { 

    const fetchHistory = async () => { 

      try { 
        setLoading(true)
        const response = await API.get( 
          "security/history" 
        ) 

        setHistory(response.data) 

      } catch (error) { 

        console.log(error) 
      } finally {
        setLoading(false)
      }
    } 

    fetchHistory() 

  }, []) 

  return ( 
    <div className="min-h-screen bg-gray-50 p-10"> 

      <h1 className="text-4xl font-bold mb-8"> 
        Website Scan History 
      </h1> 

      {loading ? (
        <div className="text-center p-10">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm text-center">
          <p className="text-gray-500">No scans found.</p>
        </div>
      ) : (
        <div className="grid gap-6"> 

          {history.map((scan) => ( 

            <div 
              key={scan._id} 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow" 
            > 
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800"> 
                    {scan.target_url} 
                  </h2> 
                  <p className="text-sm text-gray-400 mt-1">{scan.scan_type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  scan.risk_level === "Low" ? "bg-green-100 text-green-700" :
                  scan.risk_level === "Medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {scan.risk_level} Risk
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"> 
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase font-bold">Score</p>
                  <p className="text-xl font-black text-blue-600">{scan.score}/100</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                  <p className="text-xl font-bold text-gray-700">{scan.status}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-sm text-gray-400">
                <span>ID: {scan._id.substring(0, 8)}...</span>
                <span>{new Date(scan.created_at).toLocaleString()}</span>
              </div>

            </div> 

          ))} 

        </div> 
      )}

    </div> 
  ) 
} 

export default ScanHistory
