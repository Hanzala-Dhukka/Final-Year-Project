import { useEffect, useState } from "react" 
import API from "../api/api" 

function GitHubScanHistory() { 

  const [history, setHistory] = useState([]) 

  useEffect(() => { 

    const fetchHistory = async () => { 

      try { 

        const response = await API.get( 
          "/github/scan-history" 
        ) 

        setHistory(response.data) 

      } catch (error) { 

        console.log(error) 
      } 
    } 

    fetchHistory() 

  }, []) 

  return ( 
    <div className="min-h-screen bg-gray-100 p-10"> 

      <h1 className="text-4xl font-bold mb-8"> 
        GitHub Scan History 
      </h1> 

      <div className="grid gap-6"> 

        {history.map((scan) => ( 

          <div 
            key={scan._id} 
            className="bg-white p-6 rounded shadow" 
          > 

            <h2 className="text-2xl font-bold"> 
              {scan.repository} 
            </h2> 

            <div className="mt-4 space-y-2"> 

              <p> 
                Files Scanned: 
                <span className="ml-2 font-bold"> 
                  {scan.scanned_files} 
                </span> 
              </p> 

              <p> 
                Vulnerabilities: 
                <span className="ml-2 font-bold"> 
                  {scan.vulnerabilities_found} 
                </span> 
              </p> 

              <p className="text-gray-500 text-sm mt-4">
                Scanned on: {new Date(scan.created_at).toLocaleString()}
              </p>

            </div> 

          </div> 

        ))} 

      </div> 

    </div> 
  ) 
} 

export default GitHubScanHistory
