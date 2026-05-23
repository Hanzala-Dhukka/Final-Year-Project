import { 
   BrowserRouter, 
   Routes, 
   Route 
 } from "react-router-dom" 
 
import Register from "../pages/Register" 
import Login from "../pages/Login" 
import Dashboard from "../pages/Dashboard" 
import SecurityAnalyzer from "../pages/SecurityAnalyzer" 
import ScanHistory from "../pages/ScanHistory"
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
           path="/scan-history" 
           element={ 
             <ProtectedRoute> 
 
               <ScanHistory /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route path="*" element={<NotFound />} /> 
 
       </Routes> 
 
     </BrowserRouter> 
   ) 
 } 
 
 export default AppRouter
