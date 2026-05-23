import { useNavigate, Link } from "react-router-dom" 
import ProfileTest from "../components/ProfileTest" 
 
 function Dashboard() { 
 
   const navigate = useNavigate() 
 
   const handleLogout = () => { 
 
     localStorage.removeItem("token") 
 
     navigate("/login") 
   } 
 
   return ( 
     <div className="h-screen flex flex-col items-center justify-center gap-4"> 
       <ProfileTest /> 
 
       <h1 className="text-4xl font-bold"> 
         CyberShield Dashboard 
       </h1> 
 
       <p> 
         Protected Route Working 
       </p> 
 
       <Link 
         to="/security-analyzer" 
         className="bg-blue-500 text-white px-4 py-2" 
       > 
         Go to Security Analyzer 
       </Link> 

       <Link 
         to="/scan-history" 
         className="bg-gray-800 text-white px-4 py-2" 
       > 
         View Scan History 
       </Link> 
 
       <button 
         onClick={handleLogout} 
         className="bg-red-500 text-white px-4 py-2" 
       > 
         Logout 
       </button> 
 
     </div> 
   ) 
 } 
 
 export default Dashboard
