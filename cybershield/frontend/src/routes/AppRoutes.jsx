import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import AdminProtectedRoute from "./AdminProtectedRoute";

// Module E5, Part 6: Lazy-loaded pages for code splitting & faster initial load
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const AdminDashboard = lazy(() => import("../pages/Dashboard/AdminDashboard"));
const SecurityScanner = lazy(() => import("../pages/GithubScanner"));
const ScanHistory = lazy(() => import("../pages/ScanHistory/ScanHistory"));
const SecurityHeaderAnalyzer = lazy(() => import("../pages/SecurityHeaderAnalyzer/SecurityHeaderAnalyzer"));

const ThreatAnalysis = lazy(() => import("../pages/ThreatAnalysis/ThreatAnalysis"));
const ThreatReports = lazy(() => import("../pages/ThreatReports/ThreatReports"));
const ThreatDashboard = lazy(() => import("../pages/ThreatDashboard/ThreatDashboard"));
const ReportViewer = lazy(() => import("../pages/ThreatReports/ReportViewer"));

const Projects = lazy(() => import("../pages/Projects/Projects"));
const ProjectDashboard = lazy(() => import("../pages/Projects/ProjectDashboard"));
const ProjectDetails = lazy(() => import("../pages/Projects/ProjectDetails"));
const TeamMembers = lazy(() => import("../pages/Projects/TeamMembers"));
const ActivityTimeline = lazy(() => import("../pages/Projects/ActivityTimeline"));
const VersionHistory = lazy(() => import("../pages/Projects/VersionHistory"));

const AIAssistant = lazy(() => import("../pages/AIAssistant/AIAssistant"));
const SecurityCopilot = lazy(() => import("../pages/AIAssistant/SecurityCopilot"));
const CodeReview = lazy(() => import("../pages/CodeReview/CodeReview"));
const AIRecommendations = lazy(() => import("../pages/AIRecommendations/AIRecommendations"));

const OWASP = lazy(() => import("../pages/OWASP/OWASP"));

const Quiz = lazy(() => import("../pages/Quiz/Quiz"));
const Glossary = lazy(() => import("../pages/Glossary/Glossary"));

const Progress = lazy(() => import("../pages/Progress/Progress"));
const Achievements = lazy(() => import("../pages/Achievements/Achievements"));
const Leaderboard = lazy(() => import("../pages/Leaderboard/Leaderboard"));
const LearningGoals = lazy(() => import("../pages/LearningGoals/LearningGoals"));

const DailyChallenge = lazy(() => import("../pages/DailyChallenge/DailyChallenge"));

const Profile = lazy(() => import("../pages/Profile/Profile"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const SecurityChecklist = lazy(() => import("../pages/SecurityChecklist/SecurityChecklist"));
const AIChecklist = lazy(() => import("../pages/AIChecklist/AIChecklist"));
const ComplianceDashboard = lazy(() => import("../pages/Compliance/ComplianceDashboard"));
const ExecutiveDashboard = lazy(() => import("../pages/ExecutiveDashboard/ExecutiveDashboard"));
const AnalyticsPage = lazy(() => import("../pages/Analytics/AnalyticsPage"));
const SecurityReport = lazy(() => import("../pages/Reports/SecurityReport"));
const CodeViewerPage = lazy(() => import("../pages/CodeViewerPage/CodeViewerPage"));
const ScannerSetup = lazy(() => import("../pages/SecurityScanner/ScannerSetup"));
const ScannerProgress = lazy(() => import("../pages/SecurityScanner/ScannerProgress"));
const ScannerResults = lazy(() => import("../pages/SecurityScanner/ScannerResults"));
const VulnerabilityDashboard = lazy(() => import("../components/GitHubScanner/VulnerabilityDashboard/VulnerabilityDashboard"));
const AIRemediationWorkspace = lazy(() => import("../components/GitHubScanner/AIRemediation/AIRemediationWorkspace"));

const Notifications = lazy(() => import("../pages/Notifications/Notifications"));
const Automation = lazy(() => import("../pages/Automation/Automation"));
const ActivityFeed = lazy(() => import("../pages/Activity/ActivityFeed"));

const Login = lazy(() => import("../pages/Login/Login"));
const Register = lazy(() => import("../pages/Register/Register"));
const Unauthorized = lazy(() => import("../pages/Unauthorized/Unauthorized"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ForgotPassword/ResetPassword"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail/VerifyEmail"));
const ResendVerification = lazy(() => import("../pages/ResendVerification/ResendVerification"));
const VerifyMessage = lazy(() => import("../pages/VerifyMessage/VerifyMessage"));
const Onboarding = lazy(() => import("../pages/Onboarding/Onboarding"));
const OAuthCallback = lazy(() => import("../pages/OAuthCallback/OAuthCallback"));

const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

const ComponentLibrary = lazy(() => import("../pages/ComponentLibrary/ComponentLibrary"));

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-message" element={<VerifyMessage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/component-library" element={<ComponentLibrary />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route path="security-scanner" element={<SecurityScanner />} />
            <Route path="security-header-analyzer" element={<SecurityHeaderAnalyzer />} />
            <Route path="scanner/setup" element={<ScannerSetup />} />
            <Route path="scanner/progress/:id" element={<ScannerProgress />} />
            <Route path="scanner/results/:id" element={<ScannerResults />} />
            <Route path="vulnerability-dashboard/:scanId" element={<VulnerabilityDashboard />} />
            <Route path="scanner/finding/:id" element={<VulnerabilityDashboard />} />
            <Route path="scanner/remediation/:id" element={<AIRemediationWorkspace />} />
            <Route path="scanner/report/:id" element={<ScannerResults />} />
            <Route path="ai-remediation/:scanId/:findingId" element={<AIRemediationWorkspace />} />
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
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="learning-goals" element={<LearningGoals />} />
            <Route path="daily-challenge" element={<DailyChallenge />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="security-checklist" element={<SecurityChecklist />} />
            <Route path="security-checklist/:projectId" element={<SecurityChecklist />} />
            <Route path="ai-checklist" element={<AIChecklist />} />
            <Route path="compliance" element={<ComplianceDashboard />} />
            <Route path="executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="reports" element={<SecurityReport />} />
            <Route path="code-viewer/:scanId" element={<CodeViewerPage />} />
            <Route path="monitoring/notifications" element={<Notifications />} />
            <Route path="monitoring/schedules" element={<Automation />} />
            <Route path="monitoring/timeline" element={<ActivityFeed />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}