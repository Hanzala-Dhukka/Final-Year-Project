import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

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

  // ── Load dashboard data ─────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const result = await getDashboardOverview();
      setData(result);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      if (!data) setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

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
          const payload = JSON.parse(event.data);
          if (payload.event === "dashboard_update" || payload.event === "scan_completed") {
            loadDashboard(true);
          }
        } catch { /* non-JSON frame — ignore */ }
      };
      ws.onerror = () => { /* silent — WS is non-critical */ };
    } catch { /* silent */ }
  }, [loadDashboard]);

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

    const interval = setInterval(() => loadDashboard(true), 30_000);

    return () => {
      clearInterval(interval);
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
