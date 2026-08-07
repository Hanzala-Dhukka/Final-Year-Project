import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// API
import {
  getDashboardOverview,
  getDashboardPreferences,
  saveDashboardPreferences,
  resetDashboardPreferences,
} from "../../api/dashboardApi";

// Existing stat / chart widgets
import DashboardHeader from "../../components/Dashboard/DashboardHeader";
import DashboardStats from "../../components/Dashboard/DashboardStats";
import SecurityScore from "../../components/Dashboard/SecurityScore";
import VulnerabilityTrend from "../../components/Dashboard/VulnerabilityTrend";
import ThreatDistribution from "../../components/Dashboard/ThreatDistribution";
import LiveThreatFeed from "../../components/Dashboard/LiveThreatFeed";
import SystemHealth from "../../components/Dashboard/SystemHealth";
import AIInsightCard from "../../components/Dashboard/AIInsightCard";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

// Learning recommendations (Module E2)
import { getLatestRecommendations } from "../../api/learningApi";
import RecommendationCard from "../../components/Learning/RecommendationCard";

// AI Scan Summary (Module E3)
import AIScanSummary from "../../components/Dashboard/AIScanSummary";
import { getScanSummary } from "../../api/summaryApi";

// Personalized Dashboard (Module E4)
import SecurityScoreCard from "../../components/Dashboard/SecurityScoreCard";
import LearningProgress from "../../components/Dashboard/LearningProgress";
import ScanHistoryCard from "../../components/Dashboard/ScanHistoryCard";
import AIRecommendationCard from "../../components/Dashboard/AIRecommendationCard";
import ActivityTimeline from "../../components/Dashboard/ActivityTimeline";
import UserLevelCard from "../../components/Dashboard/UserLevelCard";

// Common card wrapper
import DashboardCard from "../../components/Common/DashboardCard";

// Customisation components
import DashboardFilters from "../../components/Dashboard/DashboardFilters";
import WidgetSelector from "../../components/Dashboard/WidgetSelector";
import ExportDashboard from "../../components/Dashboard/ExportDashboard";
import ResetDashboard from "../../components/Dashboard/ResetDashboard";
import CommandPalette from "../../components/Dashboard/CommandPalette";
import AIAssistantButton from "../../components/Dashboard/AIAssistantButton";

import "./dashboard.css";

const DEFAULT_FILTERS = { project: "All", severity: "All", date: "7 Days" };

export default function Dashboard() {
  const dashboardRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Data state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Preferences state
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // UI state
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Learning recommendations (Module E2)
  const [learningRecs, setLearningRecs] = useState([]);

  // AI Scan Summary (Module E3)
  const [scanSummary, setScanSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Personalized Dashboard (Module E4)
  const [personalised, setPersonalised] = useState(null);

  // Track whether we have received data at least once — using a ref so that
  // loadDashboard's identity stays stable and does NOT re-trigger the effect.
  const hasDataRef = useRef(false);

  // ── Load learning recommendations (Module E2) ──────────────────────────────
  useEffect(() => {
    getLatestRecommendations()
      .then((r) => setLearningRecs((r.recommendations || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  // ── Load AI scan summary (Module E3) ──────────────────────────────────────
  useEffect(() => {
    if (!data?.scan_id) return;
    setSummaryLoading(true);
    getScanSummary(data.scan_id)
      .then((s) => setScanSummary(s))
      .catch(() => setScanSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [data?.scan_id]);

  // ── Load personalised dashboard data (Module E4) ──────────────────────────
  useEffect(() => {
    const loadPersonalised = async () => {
      try {
        const res = await API.get("/dashboard/overview");
        setPersonalised(res.data);
      } catch {
        // Use existing dashboard data as fallback
        if (data) {
          setPersonalised({
            user: { name: data.username || "User", level: "Intermediate" },
            security_improvement: {
              current_score: data.security_score ?? 82,
              previous_score: 72,
              improvement: (data.security_score ?? 82) - 72,
            },
            learning_progress: {
              owasp_completed: 8,
              owasp_total: 10,
              quiz_completed: data.quiz_completed ?? 24,
              quiz_total: 30,
              recommendations_completed: 12,
              recommendations_total: 15,
            },
            recent_scans: [],
            recommendations: [],
            activity: {
              last_scan: data.last_scan_time || "2 hours ago",
              last_quiz: "Today",
              last_ai_chat: "Recently",
            },
          });
        }
      }
    };
    loadPersonalised();
  }, [data]);

  // ── Load dashboard data ─────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const result = await getDashboardOverview();
      setData(result);
      hasDataRef.current = true;
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      // Only show the error banner when we have no data yet
      if (!hasDataRef.current) setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // stable — no state in deps

  // ── Load preferences ────────────────────────────────────────────────────────
  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await getDashboardPreferences();
      if (Array.isArray(prefs?.hidden_widgets)) setHiddenWidgets(prefs.hidden_widgets);
      if (prefs?.filters) setFilters(prefs.filters);
    } catch (err) {
      console.warn("Could not load preferences, using defaults:", err);
    }
  }, []);

  // ── WebSocket live updates ──────────────────────────────────────────────────
  const setupWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket("ws://localhost:8000/ws/dashboard");
      socketRef.current = ws;
      ws.onmessage = (event) => {
        try {
          JSON.parse(event.data); // parse frame but don't auto-reload (prevents excessive AI calls)
        } catch { /* non-JSON frame — ignore */ }
      };
      ws.onerror = () => { /* silent — WS is non-critical */ };
    } catch { /* silent */ }
  }, []); // stable — loadDashboard not used inside, so not a dep

  useEffect(() => {
    loadDashboard();
    loadPreferences();
    setupWebSocket();

    // Ctrl+K global listener
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleGlobalKey);

    // Removed auto-refresh interval to prevent excessive API calls
    // User can manually refresh using the refresh button

    return () => {
      document.removeEventListener("keydown", handleGlobalKey);
      socketRef.current?.close();
    };
  }, [loadDashboard, loadPreferences, setupWebSocket]);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    try {
      await saveDashboardPreferences({ filters: newFilters });
    } catch { /* silent */ }
  };

  // ── Hidden widgets ───────────────────────────────────────────────────────────
  const handleWidgetVisibilityChange = async (newHidden) => {
    setHiddenWidgets(newHidden);
    setSelectorOpen(false);
    try {
      await saveDashboardPreferences({ hidden_widgets: newHidden });
    } catch { /* silent */ }
  };

  // ── Reset layout ─────────────────────────────────────────────────────────────
  const handleReset = async () => {
    try {
      await resetDashboardPreferences();
    } catch { /* silent */ }
    setHiddenWidgets([]);
    setFilters(DEFAULT_FILTERS);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <SkeletonLoader variant="text" width="40%" height="2.5rem" />
          <div className="stats-grid-skeleton">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} variant="card" height="100px" />
            ))}
          </div>
          <div className="skeleton-row-2">
            <SkeletonLoader variant="card" height="300px" />
            <SkeletonLoader variant="card" height="300px" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="error-card">
            <p>{error}</p>
            <button onClick={() => loadDashboard()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const handleAskAI = () => {
    const scanContext = {
      type: "github_scan",
      scanData: {
        security_score: data?.security_score,
        severity_summary: {
          critical: data?.critical,
          high: data?.high,
          medium: data?.medium,
          low: data?.low,
        },
      },
    };
    sessionStorage.setItem("aiAssistantContext", JSON.stringify(scanContext));
    navigate("/ai-assistant");
  };

  const aiPayload = {
    critical: data?.critical ?? 2,
    high: data?.high ?? 5,
    medium: data?.medium ?? 9,
    low: data?.low ?? 21,
    security_score: data?.security_score ?? 82,
    scans: data?.scans ?? 41,
    projects: data?.projects ?? 6,
    learning_progress: data?.learning_progress ?? 65,
    xp: data?.xp ?? 1820,
    level: data?.level ?? 4,
    vulnerability_trend: data?.vulnerability_trend ?? [],
    weekly_scans: data?.weekly_scans ?? [],
  };

  return (
    <motion.div
      className="dashboard-page"
      id="dashboard"
      ref={dashboardRef}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <DashboardHeader
        username={data?.username || "Hanzala"}
        lastUpdated={data?.updated_at}
        lastScanTime={data?.last_scan_time || "10:32 AM"}
        rank={data?.rank || "Silver"}
        onRefresh={() => loadDashboard(true)}
        isRefreshing={refreshing}
      />

      <div className="dashboard-container">
        <div className="dashboard-section">
          <DashboardStats
            projects={data?.projects ?? 6}
            scans={data?.scans ?? 41}
            threats={data?.threats ?? 7}
            xp={data?.xp ?? 1820}
          />
        </div>

        {/* ── Toolbar: filters + actions ─────────────────────────────────────── */}
        <div className="dashboard-toolbar">
          <DashboardFilters filters={filters} setFilters={handleFiltersChange} />

          <div className="dashboard-toolbar-actions">
            <div className="widget-selector-wrapper">
              <button
                className="toolbar-btn"
                onClick={() => setSelectorOpen((v) => !v)}
                aria-label="Customize widgets"
                aria-expanded={selectorOpen}
              >
                ⚙️ Widgets
              </button>
              {selectorOpen && (
                <div className="widget-selector-dropdown-wrap">
                  <WidgetSelector
                    hiddenWidgets={hiddenWidgets}
                    onSave={handleWidgetVisibilityChange}
                  />
                </div>
              )}
            </div>

            <button
              className="toolbar-btn toolbar-btn--cmd"
              onClick={() => setCmdOpen(true)}
              aria-label="Open command palette (Ctrl+K)"
              title="Ctrl + K"
            >
              ⌨️ <span>Ctrl K</span>
            </button>

            <button
              className="toolbar-btn"
              onClick={handleAskAI}
              title="Ask AI about your security"
            >
              🤖 Ask AI
            </button>
            <ExportDashboard dashboardRef={dashboardRef} />
            <ResetDashboard onReset={handleReset} />
          </div>
        </div>

        {/* ── Dashboard Grid ─────────────────────────────────────────────────── */}
        <div className="dashboard-grid">
          {!hiddenWidgets.includes("security") && (
            <DashboardCard title="Security Score" className="security-score">
              <SecurityScore score={data?.security_score ?? 82} />
            </DashboardCard>
          )}

          {!hiddenWidgets.includes("threat") && (
            <DashboardCard title="Threat Distribution" className="threat-chart">
              <ThreatDistribution
                critical={data?.critical ?? 2}
                high={data?.high ?? 5}
                medium={data?.medium ?? 9}
                low={data?.low ?? 21}
              />
            </DashboardCard>
          )}

          {!hiddenWidgets.includes("vulnerability") && (
            <DashboardCard title="Vulnerability Trend" className="vulnerability-chart">
              <VulnerabilityTrend data={data?.vulnerability_trend || []} />
            </DashboardCard>
          )}

          {!hiddenWidgets.includes("livefeed") && (
            <DashboardCard title="Live Security Events" className="live-feed">
              <LiveThreatFeed maxItems={10} />
            </DashboardCard>
          )}

          {!hiddenWidgets.includes("systemhealth") && (
            <DashboardCard title="System Health" className="system-health">
              <SystemHealth />
            </DashboardCard>
          )}

          {!hiddenWidgets.includes("ai") && (
            <DashboardCard title="AI Assistant" className="ai-card">
              <AIInsightCard securityData={aiPayload} />
            </DashboardCard>
          )}

          {(!hiddenWidgets.includes("scan_summary")) && (
            <DashboardCard title="AI Scan Summary">
              <AIScanSummary summary={scanSummary} loading={summaryLoading} />
            </DashboardCard>
          )}

          {learningRecs.length > 0 && !hiddenWidgets.includes("learning") && (
            <DashboardCard title="Recommended Learning">
              <div className="space-y-2">
                {learningRecs.map((rec, i) => (
                  <RecommendationCard key={i} item={rec} />
                ))}
              </div>
            </DashboardCard>
          )}

          {/* ── Module E4: Personalized Dashboard Cards ──────────────────────── */}
          {personalised?.user && !hiddenWidgets.includes("user_level") && (
            <UserLevelCard user={personalised.user} />
          )}

          {personalised?.security_improvement && !hiddenWidgets.includes("security_improvement") && (
            <SecurityScoreCard security={personalised.security_improvement} />
          )}

          {personalised?.learning_progress && !hiddenWidgets.includes("learning_progress") && (
            <LearningProgress progress={personalised.learning_progress} />
          )}

          {personalised?.recent_scans?.length > 0 && !hiddenWidgets.includes("scan_history") && (
            <ScanHistoryCard scans={personalised.recent_scans} />
          )}

          {personalised?.recommendations?.length > 0 && !hiddenWidgets.includes("ai_recs") && (
            <AIRecommendationCard items={personalised.recommendations} />
          )}

          {personalised?.activity && !hiddenWidgets.includes("activity") && (
            <ActivityTimeline activity={personalised.activity} />
          )}
        </div>
      </div>

      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onRefresh={() => loadDashboard(true)}
      />

      <AIAssistantButton
        dashboardContext={{
          security_score: data?.security_score,
          critical: data?.critical,
          high: data?.high,
          medium: data?.medium,
          low: data?.low,
        }}
      />
    </motion.div>
  );
}
