import { useState } from "react" 
 import API from "../api/api" 
 
 function SecurityAnalyzer() { 
 
   const [url, setUrl] = useState("") 
   const [result, setResult] = useState(null) 
 
   const handleAnalyze = async () => { 
 
     try { 
 
       const response = await API.post( 
         "/security/analyze-headers", 
         { url } 
       ) 
 
       setResult(response.data) 
 
     } catch (error) { 
 
       console.log(error) 
     } 
   } 
 
   return ( 
     <div className="min-h-screen bg-gray-100 p-10"> 
 
       <h1 className="text-4xl font-bold mb-8"> 
         Security Header Analyzer 
       </h1> 
 
       <div className="flex gap-4 mb-10"> 
 
         <input 
           type="text" 
           placeholder="Enter website URL" 
           className="border p-3 w-[400px] rounded" 
           value={url} 
           onChange={(e) => setUrl(e.target.value)} 
         /> 
 
         <button 
           onClick={handleAnalyze} 
           className="bg-black text-white px-6 rounded" 
         > 
           Analyze 
         </button> 
 
       </div> 
 
       {result && ( 
 
         <div> 
 
           <div className="bg-white p-6 rounded shadow mb-8"> 
 
             <h2 className="text-3xl font-bold"> 
               Security Score: 
               {result.analysis.total_score}/100 
             </h2> 
 
             <p className="mt-3 text-lg"> 
               Risk Level: 
               <span className="font-bold ml-2"> 
                 {result.analysis.risk_level} 
               </span> 
             </p> 
 
           </div> 
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
 
             {result.analysis.results.map((item) => ( 
 
               <div 
                 key={item.header} 
                 className="bg-white p-6 rounded shadow" 
               > 
 
                 <h2 className="text-xl font-bold mb-3"> 
                   {item.header} 
                 </h2> 
 
                 <p> 
                   Status: 
                   <span className="ml-2 font-bold"> 
                     {item.exists ? "Present" : "Missing"} 
                   </span> 
                 </p> 
 
                 <p className="mt-2"> 
                   Severity: 
                   <span className="ml-2"> 
                     {item.severity} 
                   </span> 
                 </p> 
 
                 <p className="mt-2"> 
                   Score: 
                   <span className="ml-2"> 
                     {item.score}/{item.max_score} 
                   </span> 
                 </p> 
 
                 <p className="mt-2"> 
                   OWASP: 
                   <span className="ml-2"> 
                     {item.owasp} 
                   </span> 
                 </p> 
 
                 <div className="mt-4"> 
 
                   <h3 className="font-bold"> 
                     Recommendation 
                   </h3> 
 
                   <p className="mt-1 text-sm text-gray-700"> 
                     {item.recommendation} 
                   </p> 
 
                 </div> 
 
               </div> 
 
             ))} 
 
           </div> 
 
         </div> 
       )} 
 
     </div> 
   ) 
 } 
 
 export default SecurityAnalyzer