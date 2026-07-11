import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";

import Dashboard from "../pages/Dashboard/Dashboard";
import SecurityScanner from "../pages/SecurityScanner/SecurityScanner";
import ScanHistory from "../pages/ScanHistory/ScanHistory";

import ThreatAnalysis from "../pages/ThreatAnalysis/ThreatAnalysis";
import ThreatReports from "../pages/ThreatReports/ThreatReports";

import AIAssistant from "../pages/AIAssistant/AIAssistant";

import OWASP from "../pages/OWASP/OWASP";

import Quiz from "../pages/Quiz/Quiz";
import Glossary from "../pages/Glossary/Glossary";

import Progress from "../pages/Progress/Progress";
import Achievements from "../pages/Achievements/Achievements";

import DailyChallenge from "../pages/DailyChallenge/DailyChallenge";

import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

import NotFound from "../pages/NotFound/NotFound";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Layout */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="security-scanner" element={<SecurityScanner />} />
          <Route path="scan-history" element={<ScanHistory />} />
          <Route path="threat-analysis" element={<ThreatAnalysis />} />
          <Route path="threat-reports" element={<ThreatReports />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="owasp" element={<OWASP />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="glossary" element={<Glossary />} />
          <Route path="progress" element={<Progress />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="daily-challenge" element={<DailyChallenge />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}