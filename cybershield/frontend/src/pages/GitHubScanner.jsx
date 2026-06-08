import { useState } from "react" 
import API from "../api/api" 

function GitHubScanner() { 

  const [repoUrl, setRepoUrl] = useState("") 
  const [result, setResult] = useState(null) 
  const [loading, setLoading] = useState(false) 

  const handleScan = async () => { 

    try { 

      setLoading(true) 

      const response = await API.post( 
        "/github/scan-repository", 
        { 
          repo_url: repoUrl 
        } 
      ) 

      setResult(response.data) 

    } catch (error) { 
 
      console.log(error) 
      const message = error.response?.data?.detail || "Repository scan failed"
      alert(message) 
    } 

    finally { 

      setLoading(false) 
    } 
  } 

  const downloadReport = async () => { 
 
    try { 
 
      const response = await API.post( 
        "/github/generate-pdf", 
        { 
          report: result.report 
        }, 
        { 
          responseType: "blob" 
        } 
      ) 
 
      const url = window.URL.createObjectURL( 
        new Blob([response.data]) 
      ) 
 
      const link = document.createElement("a") 
 
      link.href = url 
 
      link.setAttribute( 
        "download", 
        "CyberShield_Report.pdf" 
      ) 
 
      document.body.appendChild(link) 
 
      link.click() 
 
    } catch (error) { 
 
      console.log(error) 
    } 
  } 

  return ( 
    <div className="min-h-screen bg-gray-100 p-10"> 

      <h1 className="text-4xl font-bold mb-8"> 
        GitHub Security Scanner 
      </h1> 

      <div className="flex gap-4 mb-10"> 

        <input 
          type="text" 
          placeholder="Enter GitHub repository URL" 
          className="border p-3 rounded w-[500px]" 
          value={repoUrl} 
          onChange={(e) => 
            setRepoUrl(e.target.value) 
          } 
        /> 

        <button 
          onClick={handleScan} 
          className="bg-black text-white px-6 rounded" 
        > 
          {loading ? "Scanning..." : "Scan Repository"} 
        </button> 

      </div> 

      {result && ( 
 
        <div className="space-y-8"> 
 
          <div className="bg-white p-6 rounded shadow"> 

            <h2 className="text-3xl font-bold"> 
              {result.repository} 
            </h2> 

            <div className="mt-4 space-y-2"> 

              <p> 
                Files Scanned: 
                <span className="font-bold ml-2"> 
                  {result.scanned_files} 
                </span> 
              </p> 

              <p> 
                Vulnerabilities Found: 
                <span className="font-bold ml-2"> 
                  {result.vulnerabilities_found} 
                </span> 
              </p> 

              <p className="mt-2">

                Risk Score:

                <span
                  className={`
                    ml-2 font-bold
                    ${
                      result.risk_score >= 90
                        ? "text-green-600"
                        : result.risk_score >= 70
                        ? "text-blue-600"
                        : result.risk_score >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }
                  `}
                >
                  {result.risk_score}/100
                </span>

              </p>

            </div> 

          </div> 

          <div className="bg-white p-6 rounded shadow"> 
 
            <h2 className="text-3xl font-bold mb-6"> 
              AI Security Report 
            </h2> 
 
            <div className="space-y-6">

              <div>
                <p className="text-xl font-semibold"> 
                  Risk Level: 
                  <span className={`ml-2 ${
                    result.ai_report?.risk_level === 'Critical' ? 'text-red-600' :
                    result.ai_report?.risk_level === 'High' ? 'text-orange-600' :
                    result.ai_report?.risk_level === 'Medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {result.ai_report?.risk_level} 
                  </span>
                </p> 
              </div>

              <div>
                <h3 className="text-xl font-bold">Repository Summary:</h3>
                <p className="mt-2 text-gray-700"> 
                  {result.ai_report?.summary} 
                </p> 
              </div>

              {result.ai_report?.business_impact?.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold">Business Impact:</h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
                    {result.ai_report.business_impact.map((impact, i) => (
                      <li key={i}>{impact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.ai_report?.recommendations?.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold">Recommendations:</h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
                    {result.ai_report.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button 
                onClick={downloadReport} 
                disabled={loading} 
                className="bg-black text-white px-8 py-3 rounded font-bold mt-4 disabled:opacity-50 hover:bg-gray-800 transition-colors" 
              > 
                Download PDF Report 
              </button>

            </div>
 
          </div>

          <div> 
 
            {result.vulnerabilities_found === 0 && ( 
 
              <div className="bg-green-100 border border-green-400 p-6 rounded"> 
 
                <h2 className="text-2xl font-bold text-green-700"> 
                  No Vulnerabilities Found 
                </h2> 
 
                <p className="mt-2"> 
                  Repository appears secure based on current scans. 
                </p> 
 
              </div> 
            )} 
 
            {result.vulnerabilities_found > 0 && ( 
              <> 
                <h2 className="text-2xl font-bold mb-6"> 
                  Vulnerability Findings 
                </h2> 
 
                <div className="grid gap-6"> 
 
                  {result.findings.map((finding, index) => ( 
 
                    <div 
                      key={index} 
                      className="bg-white p-6 rounded shadow" 
                    > 
 
                      <h3 className="text-xl font-bold mb-4"> 
                        {finding.file} 
                      </h3> 
 
                      <div className="space-y-4"> 
 
                        {finding.issues.map((issue, issueIndex) => ( 
 
                          <div 
                            key={issueIndex} 
                            className="border p-4 rounded" 
                          > 
 
                            <p> 
                              Type: 
                              <span className="font-bold ml-2"> 
                                {issue.type} 
                              </span> 
                            </p> 
 
                            <p className="mt-2"> 
 
                              Severity: 
 
                              <span 
                                className={` 
                                  ml-2 font-bold 
                                  ${ 
                                    issue.severity === "Critical" 
                                      ? "text-red-600" 
                                      : issue.severity === "High" 
                                      ? "text-orange-500" 
                                      : "text-yellow-500" 
                                  } 
                                `} 
                              > 
                                {issue.severity} 
                              </span> 
 
                            </p> 
 
                            <p className="mt-2"> 
                              Matches Found: 
                              <span className="ml-2"> 
                                {issue.matches_found} 
                              </span> 
                            </p> 
 
                          </div> 
 
                        ))} 
 
                      </div> 
 
                    </div> 
 
                  ))} 
 
                </div> 
              </> 
            )} 
 
          </div> 

        </div> 
      )} 

    </div> 
  ) 
} 

export default GitHubScanner
