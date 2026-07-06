import { 
   BrowserRouter, 
   Routes, 
   Route,
   Navigate
 } from "react-router-dom" 
 
 import Register from "../pages/Register"
 import Login from "../pages/Login"
 import Dashboard from "../pages/Dashboard"
 import SecurityAnalyzer from "../pages/SecurityAnalyzer"
 import ScanHistory from "../pages/ScanHistory"
 import GitHubScanner from "../pages/GitHubScanner" 
 import GitHubScanHistory from "../pages/GitHubScanHistory"
 import AnalyticsDashboard from "../pages/AnalyticsDashboard"
 import ReportCenter from "../pages/ReportCenter"
 import AdminDashboard from "../pages/AdminDashboard"
 import Quiz from "../pages/Quiz"
 import Glossary from "../pages/Glossary"
 import OwaspSimulator from "../pages/OwaspSimulator"
 import ThreatModeling from "../pages/ThreatModeling"
 import ThreatAnalysis from "../pages/ThreatAnalysis"
 import RiskMatrix from "../pages/RiskMatrix"
 import SecurityReport from "../pages/SecurityReport"
  import AIAssistant from "../pages/AIAssistant"
  import OWASPDefenseMode from "../pages/OWASPDefenseMode"
  import InteractiveLabs from "../pages/InteractiveLabs"
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
 
         <Route 
           path="/analytics" 
           element={ 
             <ProtectedRoute> 
 
               <AnalyticsDashboard /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route 
           path="/report-center" 
           element={ 
             <ProtectedRoute> 
 
               <ReportCenter /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route 
           path="/quiz" 
           element={ 
             <ProtectedRoute> 
 
               <Quiz /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route 
           path="/glossary" 
           element={ 
             <ProtectedRoute> 
 
               <Glossary /> 
 
             </ProtectedRoute> 
           } 
         /> 
 
         <Route 
          path="/owasp-simulator" 
          element={ 
            <ProtectedRoute> 

              <OwaspSimulator /> 

            </ProtectedRoute> 
          } 
        />

        <Route 
          path="/threat-modeling" 
          element={ 
            <ProtectedRoute> 

              <ThreatModeling /> 

            </ProtectedRoute> 
          } 
        /> 

        <Route 
          path="/threat-analysis" 
          element={ 
            <ProtectedRoute> 

              <ThreatAnalysis /> 

            </ProtectedRoute> 
          } 
        /> 

        <Route 
          path="/risk-matrix" 
          element={ 
            <ProtectedRoute> 

              <RiskMatrix /> 

            </ProtectedRoute> 
          } 
        /> 

        <Route 
          path="/security-report" 
          element={ 
            <ProtectedRoute> 

              <SecurityReport /> 

            </ProtectedRoute> 
          } 
        /> 

        <Route 
          path="/ai-assistant" 
          element={ 
            <ProtectedRoute> 
 
              <AIAssistant /> 
 
            </ProtectedRoute> 
          } 
        />

        <Route 
          path="/owasp-defense" 
          element={ 
            <ProtectedRoute> 
 
              <OWASPDefenseMode /> 
 
            </ProtectedRoute> 
          } 
        />

        <Route 
          path="/interactive-labs" 
          element={ 
            <ProtectedRoute> 
 
              <InteractiveLabs /> 
 
            </ProtectedRoute> 
          } 
        />
 
         <Route 
           path="/admin" 
           element={ 
             <ProtectedRoute> 

               <AdminDashboard /> 

             </ProtectedRoute> 
           } 
         /> 
 
         <Route path="*" element={<NotFound />} />
 
       </Routes> 
 
     </BrowserRouter> 
   ) 
 } 
 
 export default AppRouter
