import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

import Dashboard from "../pages/Dashboard/Dashboard";
import SecurityScanner from "../pages/SecurityScanner/SecurityScanner";
import ScanHistory from "../pages/ScanHistory/ScanHistory";

import ThreatAnalysis from "../pages/ThreatAnalysis/ThreatAnalysis";
import ThreatReports from "../pages/ThreatReports/ThreatReports";
import ThreatDashboard from "../pages/ThreatDashboard/ThreatDashboard";
import ReportViewer from "../pages/ThreatReports/ReportViewer";

import Projects from "../pages/Projects/Projects";
import ProjectDashboard from "../pages/Projects/ProjectDashboard";
import ProjectDetails from "../pages/Projects/ProjectDetails";
import TeamMembers from "../pages/Projects/TeamMembers";
import ActivityTimeline from "../pages/Projects/ActivityTimeline";
import VersionHistory from "../pages/Projects/VersionHistory";

import AIAssistant from "../pages/AIAssistant/AIAssistant";
import SecurityCopilot from "../pages/AIAssistant/SecurityCopilot";
import CodeReview from "../pages/CodeReview/CodeReview";
import AIRecommendations from "../pages/AIRecommendations/AIRecommendations";

import OWASP from "../pages/OWASP/OWASP";

import Quiz from "../pages/Quiz/Quiz";
import Glossary from "../pages/Glossary/Glossary";

import Progress from "../pages/Progress/Progress";
import Achievements from "../pages/Achievements/Achievements";

import DailyChallenge from "../pages/DailyChallenge/DailyChallenge";

import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import SecurityChecklist from "../pages/SecurityChecklist/SecurityChecklist";
import AIChecklist from "../pages/AIChecklist/AIChecklist";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Unauthorized from "../pages/Unauthorized/Unauthorized";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import ResetPassword from "../pages/ResetPassword/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail/VerifyEmail";

import NotFound from "../pages/NotFound/NotFound";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="security-scanner" element={<SecurityScanner />} />
            <Route path="scan-history" element={<ScanHistory />} />
            <Route path="threat-analysis" element={<ThreatAnalysis />} />
            <Route path="threat-reports" element={<ThreatReports />} />
            <Route path="threat-reports/:id" element={<ReportViewer />} />
            <Route path="threat-dashboard" element={<ThreatDashboard />} />
            <Route path="threat-dashboard/:id" element={<ThreatDashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDashboard />} />
            <Route path="projects/:id/details" element={<ProjectDetails />} />
            <Route path="projects/:id/members" element={<TeamMembers />} />
            <Route path="projects/:id/timeline" element={<ActivityTimeline />} />
            <Route path="projects/:id/versions" element={<VersionHistory />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="security-copilot" element={<SecurityCopilot />} />
            <Route path="code-review" element={<CodeReview />} />
            <Route path="ai-recommendations" element={<AIRecommendations />} />
            <Route path="owasp" element={<OWASP />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="glossary" element={<Glossary />} />
            <Route path="progress" element={<Progress />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="daily-challenge" element={<DailyChallenge />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="security-checklist" element={<SecurityChecklist />} />
            <Route path="ai-checklist" element={<AIChecklist />} />
            <Route path="compliance" element={<ComplianceDashboard />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}