import { useEffect, useState } from "react" 
 import API from "../api/api" 
 
 function ScanHistory() { 
 
   const [scans, setScans] = useState([]) 
 
   useEffect(() => { 
 
     const fetchHistory = async () => { 
 
       try { 
 
         const response = await API.get( 
           "/security/scan-history" 
         ) 
 
         setScans(response.data) 
 
       } catch (error) { 
 
         console.log(error) 
       } 
     } 
 
     fetchHistory() 
 
   }, []) 
 
   return ( 
     <div className="p-10"> 
 
       <h1 className="text-4xl font-bold mb-8"> 
         Scan History 
       </h1> 
 
       <div className="grid gap-6"> 
 
         {scans.map((scan) => ( 
 
           <div 
             key={scan._id} 
             className="bg-white p-6 rounded shadow" 
           > 
 
             <h2 className="text-2xl font-bold"> 
               {scan.url} 
             </h2> 
 
             <p className="mt-2"> 
               Score: 
               {scan.analysis.total_score} 
             </p> 
 
             <p> 
               Risk: 
               {scan.analysis.risk_level} 
             </p> 
 
           </div> 
 
         ))} 
 
       </div> 
 
     </div> 
   ) 
 } 
 
 export default ScanHistory