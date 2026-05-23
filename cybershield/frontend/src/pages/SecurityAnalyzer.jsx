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
     <div className="p-10"> 
 
       <h1 className="text-3xl font-bold mb-6"> 
         Security Header Analyzer 
       </h1> 
 
       <div className="flex gap-4"> 
 
         <input 
           type="text" 
           placeholder="Enter website URL (e.g. google.com)" 
           className="border p-2 w-96" 
           value={url} 
           onChange={(e) => setUrl(e.target.value)} 
         /> 
 
         <button 
           onClick={handleAnalyze} 
           disabled={loading || !url}
           className={`px-4 py-2 text-white ${loading || !url ? 'bg-gray-400' : 'bg-black'}`}
         > 
           {loading ? "Analyzing..." : "Analyze"} 
         </button> 
 
       </div> 

       {error && (
         <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
           {error}
         </div>
       )}
 
       {result && ( 
 
         <div className="mt-10 p-6 border rounded shadow-lg bg-white"> 
 
           <h2 className="text-2xl font-bold mb-4"> 
             Analysis Result for: {result.url}
           </h2>

           <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-gray-50 rounded">
               <p className="text-sm text-gray-500 uppercase font-bold">Security Score</p>
               <p className="text-3xl font-black text-blue-600">{result.analysis.total_score} / 100</p>
             </div>

             <div className="p-4 bg-gray-50 rounded">
               <p className="text-sm text-gray-500 uppercase font-bold">Risk Level</p>
               <p className={`text-3xl font-black ${
                 result.analysis.risk_level === "Low" ? "text-green-600" : 
                 result.analysis.risk_level === "Medium" ? "text-yellow-600" : "text-red-600"
               }`}>
                 {result.analysis.risk_level}
               </p>
             </div>
           </div>

           <div className="mt-6">
             <h3 className="text-xl font-bold mb-3">Header Details</h3>
             <div className="space-y-2">
               {result.analysis.results.map((item, index) => (
                 <div key={index} className="flex justify-between items-center p-3 border-b last:border-0">
                   <span className="font-mono">{item.header}</span>
                   <div className="flex items-center gap-3">
                     <span className={`px-2 py-1 rounded text-xs font-bold ${item.exists ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                       {item.exists ? "Found" : "Missing"}
                     </span>
                     <span className="font-bold text-gray-600">+{item.score} pts</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
 
         </div> 
       )} 
 
     </div> 
   ) 
 } 
 
 export default SecurityAnalyzer
