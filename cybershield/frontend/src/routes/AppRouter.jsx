import { 
   BrowserRouter, 
   Routes, 
   Route 
 } from "react-router-dom" 
 
import Register from "../pages/Register" 
import Login from "../pages/Login" 
import Dashboard from "../pages/Dashboard" 
import SecurityAnalyzer from "../pages/SecurityAnalyzer" 
import GitHubScanner from "../pages/GitHubScanner" 
import GitHubScanHistory from "../pages/GitHubScanHistory"
import NotFound from "../pages/NotFound"
 
import ProtectedRoute from "./ProtectedRoute" 
 
 function Home() { 
   return <h1>Home Page</h1> 
 } 
 
 function AppRouter() { 
 
   return ( 
     <BrowserRouter> 
 
       <Routes> 
 
         <Route path="/" element={<Home />} /> 
 
         <Route path="/login" element={<Login />} /> 
 
         <Route path="/register" element={<Register />} /> 
 
         <Route 
           path="/dashboard" 
           element={ 
             <ProtectedRoute> 
 
               <Dashboard /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route 
           path="/security-analyzer" 
           element={ 
             <ProtectedRoute> 
 
               <SecurityAnalyzer /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route 
           path="/github-scanner" 
           element={ 
             <ProtectedRoute> 
 
               <GitHubScanner /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route 
           path="/github-history" 
           element={ 
             <ProtectedRoute> 
 
               <GitHubScanHistory /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route path="*" element={<NotFound />} /> 
 
       </Routes> 
 
     </BrowserRouter> 
   ) 
 } 
 
 export default AppRouter
