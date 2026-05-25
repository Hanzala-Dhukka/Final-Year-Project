import { useState } from "react" 
import API from "../api/api" 
 
function SecurityAnalyzer() { 
 
   const [url, setUrl] = useState("") 
   const [result, setResult] = useState(null) 
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState(null)
 
   const handleAnalyze = async () => { 
     setLoading(true)
     setError(null)
     setResult(null)
 
     try { 
 
       const response = await API.post( 
         "security/analyze-headers", 
         { url } 
       ) 
 
       setResult(response.data) 
 
     } catch (err) { 
       console.error(err)
       setError(err.response?.data?.detail || "An error occurred during analysis")
     } finally {
       setLoading(false)
     }
   } 
 
   return ( 
     <div className="p-10 max-w-6xl mx-auto"> 
 
       <h1 className="text-4xl font-black mb-2"> 
         Security Header Analyzer 
       </h1> 
       <p className="text-gray-500 mb-8">
         Analyze website security headers and identify potential vulnerabilities.
       </p>
 
       <div className="flex gap-4 p-6 bg-white border rounded-xl shadow-sm mb-10"> 
 
         <input 
           type="text" 
           placeholder="Enter website URL (e.g. google.com)" 
           className="border p-3 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" 
           value={url} 
           onChange={(e) => setUrl(e.target.value)} 
         /> 
 
         <button 
           onClick={handleAnalyze} 
           disabled={loading || !url}
           className={`px-8 py-3 text-white font-bold rounded-lg transition-all ${loading || !url ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}
         > 
           {loading ? "Analyzing..." : "Analyze Now"} 
         </button> 
 
       </div> 

       {error && (
         <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded-lg">
           <strong>Error:</strong> {error}
         </div>
       )}
 
       {result && ( 
 
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"> 
 
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-6 bg-white border rounded-xl shadow-sm text-center">
               <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-2">Security Score</p>
               <div className="relative inline-flex items-center justify-center">
                  <span className="text-5xl font-black text-blue-600">{result.analysis.total_score}</span>
                  <span className="text-gray-300 text-xl ml-1">/100</span>
               </div>
             </div>

             <div className="p-6 bg-white border rounded-xl shadow-sm text-center">
               <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-2">Risk Level</p>
               <p className={`text-4xl font-black ${
                 result.analysis.risk_level === "Low" ? "text-green-600" : 
                 result.analysis.risk_level === "Medium" ? "text-yellow-600" : "text-red-600"
               }`}>
                 {result.analysis.risk_level}
               </p>
             </div>

             <div className="p-6 bg-white border rounded-xl shadow-sm text-center">
               <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-2">Analysis Target</p>
               <p className="text-xl font-bold truncate text-gray-700">{result.url}</p>
               <p className="text-xs text-gray-400 mt-2">Scan completed successfully</p>
             </div>
           </div>

           {/* Vulnerability Breakdown */}
           <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
             <div className="p-6 border-b bg-gray-50">
                <h3 className="text-xl font-bold">Vulnerability Report</h3>
                <p className="text-sm text-gray-500">Detailed breakdown of security header configurations.</p>
             </div>
             <div className="divide-y">
               {result.analysis.results.map((item, index) => (
                 <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="font-mono text-lg font-bold text-gray-800">{item.header}</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                            item.severity === "Critical" ? "bg-red-100 text-red-700" :
                            item.severity === "High" ? "bg-orange-100 text-orange-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {item.severity}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
                            {item.owasp}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 uppercase font-bold">Points</p>
                          <p className={`font-black ${item.exists ? "text-green-600" : "text-gray-300"}`}>
                            {item.score} / {item.max_score}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          item.exists ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.exists ? "Protected" : "Vulnerable"}
                        </span>
                      </div>
                   </div>
                   
                   <div className={`p-4 rounded-lg text-sm ${item.exists ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-800 border border-red-100"}`}>
                      <p className="font-bold mb-1">Recommendation:</p>
                      <p>{item.recommendation}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Raw Headers (Optional/Expandable) */}
           <details className="group bg-white border rounded-xl shadow-sm">
              <summary className="p-6 cursor-pointer font-bold text-gray-700 list-none flex justify-between items-center">
                <span>Raw HTTP Headers</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="p-6 pt-0 border-t">
                <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(result.headers, null, 2)}
                </pre>
              </div>
           </details>
 
         </div> 
       )} 
 
     </div> 
   ) 
 } 
 
 export default SecurityAnalyzer
