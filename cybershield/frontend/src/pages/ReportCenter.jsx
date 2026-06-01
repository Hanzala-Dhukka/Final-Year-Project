import { useEffect, useState } from "react" 
 import API from "../api/api" 
 
 function ReportCenter() { 
 
   const [reports, setReports] = useState([]) 
   const [search, setSearch] = useState("") 
   const [riskFilter, setRiskFilter] = useState("All") 
 
   const stats = {
     total: reports.length,
     critical: reports.filter(r => r.risk_level === "Critical").length,
     high: reports.filter(r => r.risk_level === "High").length,
     medium: reports.filter(r => r.risk_level === "Medium").length,
     low: reports.filter(r => r.risk_level === "Low").length
   }

   useEffect(() => { 
 
     const fetchReports = async () => { 
 
       const response = await API.get( 
         "/github/reports" 
       ) 
 
       setReports(response.data) 
     } 
 
     fetchReports() 
 
   }, []) 
 
   return ( 
 
     <div className="min-h-screen bg-gray-50 p-10"> 
 
       <h1 className="text-4xl font-bold mb-8"> 
         Security Report Center 
       </h1> 
 
       <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
         <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
           <p className="text-gray-500 text-sm font-semibold uppercase">Total Reports</p>
           <p className="text-3xl font-bold">{stats.total}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-purple-600">
           <p className="text-gray-500 text-sm font-semibold uppercase">Critical</p>
           <p className="text-3xl font-bold">{stats.critical}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
           <p className="text-gray-500 text-sm font-semibold uppercase">High Risk</p>
           <p className="text-3xl font-bold">{stats.high}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
           <p className="text-gray-500 text-sm font-semibold uppercase">Medium Risk</p>
           <p className="text-3xl font-bold">{stats.medium}</p>
         </div>
         <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
           <p className="text-gray-500 text-sm font-semibold uppercase">Low Risk</p>
           <p className="text-3xl font-bold">{stats.low}</p>
         </div>
       </div>
 
       <div className="flex flex-wrap gap-4 mb-8">
         <input 
           type="text" 
           placeholder="Search reports..." 
           className="border p-3 rounded w-full max-w-md" 
           value={search} 
           onChange={(e) => 
             setSearch(e.target.value) 
           } 
         /> 

         <select 
           className="border p-3 rounded bg-white"
           value={riskFilter} 
           onChange={(e) => 
             setRiskFilter( 
               e.target.value 
             ) 
           } 
         > 
           <option value="All">All Risk Levels</option> 
           <option value="Low">Low</option> 
           <option value="Medium">Medium</option> 
           <option value="High">High</option> 
           <option value="Critical">Critical</option>
         </select>
       </div>
 
       <div className="grid gap-6"> 
 
         {reports 
           .filter(report => {
             const matchesSearch = report.summary 
               .toLowerCase() 
               .includes(search.toLowerCase());
             const matchesRisk = riskFilter === "All" || report.risk_level === riskFilter;
             return matchesSearch && matchesRisk;
           }) 
           .map((report) => ( 
 
           <div 
             key={report._id} 
             className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow" 
           > 
             <div className="flex justify-between items-start mb-4">
               <h2 className="text-xl font-bold text-gray-800"> 
                 {report.title || "Security Report"} 
               </h2> 
               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                 report.risk_level === "Critical" ? "bg-purple-100 text-purple-700" :
                 report.risk_level === "High" ? "bg-red-100 text-red-700" :
                 report.risk_level === "Medium" ? "bg-yellow-100 text-yellow-700" :
                 "bg-green-100 text-green-700"
               }`}>
                 {report.risk_level} Risk
               </span>
             </div>
 
             <p className="text-gray-600 leading-relaxed"> 
               {report.summary} 
             </p> 

             <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-sm text-gray-400">
               <span>ID: {report._id.substring(0, 8)}...</span>
               {report.created_at && (
                 <span>{new Date(report.created_at).toLocaleDateString()}</span>
               )}
             </div>
           </div> 
 
         ))} 
 
       </div> 
 
     </div> 
   ) 
 } 
 
 export default ReportCenter