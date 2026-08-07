import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, RefreshCw, ChevronDown, AlertTriangle, Zap, Plus } from "lucide-react";
import checklistApi from "../../api/checklistApi";
import recommendationApi from "../../api/recommendationApi";
import { projectApi } from "../../api/projectApi";
import ChecklistCard from "../../components/Checklist/ChecklistCard";
import ChecklistProgress from "../../components/Checklist/ChecklistProgress";
import ChecklistFilter from "../../components/Checklist/ChecklistFilter";
import ChecklistCategory from "../../components/Checklist/ChecklistCategory";
import RecommendedTasks from "../../components/Checklist/RecommendedTasks";
import SecurityScore from "../../components/Checklist/SecurityScore";
import RiskReduction from "../../components/Checklist/RiskReduction";
import CategorySecurity from "../../components/Checklist/CategorySecurity";
import SecurityImprovement from "../../components/Checklist/SecurityImprovement";
import AIRecommendationWidget from "../../components/Checklist/AIRecommendationWidget";

const ALL_CATEGORIES = [
  "Authentication",
  "Authorization",
  "Input Validation",
  "Cryptography",
  "Secrets Management",
  "Logging",
  "Network Security",
  "API Security",
  "Database Security",
  "Cloud Security",
  "Secure Coding",
];

export default function SecurityChecklist() {
  const { projectId: urlProjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(urlProjectId || "");
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Scanner recommendations (Module SC3)
  const [recommendations, setRecommendations] = useState([]);
  const [recStats, setRecStats] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  // Security Posture (Module SC4)
  const [posture, setPosture] = useState(null);

  // SC5: AI Recommendations & Score Tracking
  const [improvement, setImprovement] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);

  const [severity, setSeverity] = useState("All");
  const [category, setCategory] = useState("All");

  // Load projects and resolve initial project ID
  useEffect(() => {
    (async () => {
      try {
        const res = await projectApi.list();
        const list = Array.isArray(res.data) ? res.data : [];
        setProjects(list);

        // Priority: URL param > navigation state > first project
        const stateProjectId = location.state?.projectId;
        const initialId = urlProjectId || stateProjectId || (list.length ? String(list[0].id ?? list[0]._id) : "");
        if (initialId) setProjectId(initialId);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    })();
  }, [urlProjectId, location.state]);

  // Load checklist + score + recommendations when project changes
  const loadChecklist = async (pid) => {
    if (!pid) return;
    setLoading(true);
    setError("");
    try {
      const [checklistRes, scoreRes] = await Promise.all([
        checklistApi.getProjectChecklists(pid),
        checklistApi.getScore(pid),
      ]);
      setItems(checklistRes.data || []);
      setScore(scoreRes.data);
    } catch (e) {
      console.error("Failed to load checklist", e);
      setError(e.response?.data?.detail || "Failed to load security checklist.");
    } finally {
      setLoading(false);
    }
  };

  // Load scanner recommendations (Module SC3)
  const loadRecommendations = async (pid) => {
    if (!pid) return;
    setRecLoading(true);
    try {
      const [recRes, statsRes] = await Promise.all([
        recommendationApi.list(pid),
        recommendationApi.stats(pid),
      ]);
      setRecommendations(recRes.data || []);
      setRecStats(statsRes.data);
    } catch (e) {
      // Recommendations are optional — don't block checklist loading
      console.warn("Failed to load recommendations:", e);
    } finally {
      setRecLoading(false);
    }
  };

  // Load security posture (Module SC4)
  const loadPosture = async (pid) => {
    if (!pid) return;
    try {
      const res = await checklistApi.getSecurityPosture(pid);
      setPosture(res.data);
    } catch (e) {
      console.warn("Failed to load security posture:", e);
    }
  };

  // Load SC5 data (improvement + score history)
  const loadSC5 = async (pid) => {
    if (!pid) return;
    try {
      const [impRes, histRes] = await Promise.all([
        checklistApi.getImprovement(pid),
        checklistApi.getScoreHistory(pid),
      ]);
      setImprovement(impRes.data);
      setScoreHistory(histRes.data || []);
    } catch (e) {
      console.warn("Failed to load SC5 data:", e);
    }
  };

  useEffect(() => {
    loadChecklist(projectId);
    loadRecommendations(projectId);
    loadPosture(projectId);
    loadSC5(projectId);
  }, [projectId]);

  // Generate project checklist
  const generate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError("");
    try {
      await checklistApi.generateChecklist(projectId, {});
      await loadChecklist(projectId);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to generate checklist.");
    } finally {
      setGenerating(false);
    }
  };

  // Toggle a task's status
  const toggle = async (item) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    const prev = items;
    setItems((cur) =>
      cur.map((it) =>
        it.checklist_id === item.checklist_id ? { ...it, status: newStatus } : it
      )
    );
    try {
      await checklistApi.updateStatus(item.checklist_id, projectId, newStatus);
      const scoreRes = await checklistApi.getScore(projectId);
      setScore(scoreRes.data);
      loadRecommendations(projectId);
      loadPosture(projectId);
      // SC5: Track score improvement
      if (newStatus === "completed") {
        checklistApi.trackCompletion(projectId).catch(() => {});
      }
      loadSC5(projectId);
    } catch (e) {
      setItems(prev);
      setError(e.response?.data?.detail || "Failed to update status.");
    }
  };

  // Filtering
  const visible = useMemo(() => {
    return items.filter((it) => {
      const sevOk = severity === "All" || it.severity === severity;
      const catOk = category === "All" || it.category === category;
      return sevOk && catOk;
    });
  }, [items, severity, category]);

  const categories = useMemo(() => {
    const present = [...new Set(items.map((i) => i.category))];
    return ALL_CATEGORIES.filter((c) => present.includes(c));
  }, [items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
          }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
              Security Hardening
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary, #cbd5e1)", margin: 0, marginTop: 2 }}>
              Complete security tasks to harden your project
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Project selector */}
          <div style={{ position: "relative" }}>
            <select
              value={projectId}
              onChange={(e) => {
                const newId = e.target.value;
                setProjectId(newId);
                if (newId) navigate(`/security-checklist/${newId}`, { replace: true });
              }}
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                background: "var(--bg-secondary, #1e293b)",
                border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
                borderRadius: 10,
                padding: "10px 36px 10px 14px",
                fontSize: 14,
                color: "var(--text-primary, #f8fafc)",
                cursor: "pointer",
                outline: "none",
                minWidth: 180,
              }}
            >
              {projects.length === 0 && <option value="">No projects</option>}
              {projects.map((p) => (
                <option key={p.id ?? p._id} value={String(p.id ?? p._id)} style={{ background: "#1e293b", color: "#f8fafc" }}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || !projectId}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px",
              background: generating
                ? "rgba(37,99,235,0.5)"
                : "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 600, color: "#fff",
              cursor: generating ? "not-allowed" : "pointer",
              boxShadow: generating ? "none" : "0 4px 16px rgba(37,99,235,0.35)",
              transition: "all 0.2s ease",
            }}
          >
            <RefreshCw
              size={16}
              style={generating ? { animation: "spin 1s linear infinite" } : {}}
            />
            {generating ? "Generating..." : "Generate Checklist"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 12, color: "#fca5a5", fontSize: 13,
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Security Posture Dashboard (Module SC4) */}
      {posture && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 16 }}>
          <SecurityScore
            score={posture.score}
            level={posture.level}
            completedTasks={posture.completed_tasks}
            totalTasks={posture.total_tasks}
          />
          <RiskReduction
            riskReduced={posture.risk_reduced}
            riskRemaining={posture.risk_remaining}
            totalRisk={posture.total_risk}
            completedControls={posture.completed_tasks}
          />
          <CategorySecurity categories={posture.categories} />
        </div>
      )}

      {/* Fallback: Simple score display if posture not loaded */}
      {!posture && score && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
          <ChecklistProgress
            score={score.score}
            completed={score.completed_tasks}
            total={score.total_tasks}
          />
          <div style={{
            background: "var(--glass-bg, rgba(17,24,39,0.70))",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
            borderRadius: 16, padding: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Zap size={16} color="#F59E0B" />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
                Category Breakdown
              </p>
            </div>
            {score.by_category.map((c) => (
              <ChecklistCategory
                key={c.category}
                category={c.category}
                total={c.total}
                completed={c.completed}
                score={c.score}
              />
            ))}
          </div>
        </div>
      )}

      {/* SC5: Security Improvement + AI Recommendations */}
      {(improvement?.has_data || items.some((t) => t.source)) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SecurityImprovement data={improvement} history={scoreHistory} />
          <AIRecommendationWidget tasks={items.filter((t) => t.source)} loading={loading} />
        </div>
      )}

      {/* Scanner Recommendations (Module SC3) */}
      {recStats && recStats.total > 0 && (
        <RecommendedTasks tasks={recommendations} stats={recStats} loading={recLoading} />
      )}

      {/* Filter + Tasks */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <div>
          <ChecklistFilter
            categories={categories}
            severity={severity}
            category={category}
            onSeverity={setSeverity}
            onCategory={setCategory}
          />
        </div>

        <div>
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 60, color: "var(--text-secondary, #cbd5e1)", fontSize: 14, gap: 10,
            }}>
              <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
              Loading checklist...
            </div>
          ) : visible.length === 0 ? (
            <div style={{
              background: "var(--glass-bg, rgba(17,24,39,0.70))",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border, rgba(255,255,255,0.10))",
              borderRadius: 16, padding: 60, textAlign: "center",
            }}>
              {projects.length === 0 ? (
                <>
                  <Plus size={48} color="#475569" style={{ margin: "0 auto 16px" }} />
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
                    No projects yet
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary, #cbd5e1)", marginTop: 8 }}>
                    Create a project first to generate a security checklist.
                  </p>
                  <button
                    onClick={() => navigate("/projects")}
                    style={{
                      marginTop: 16, padding: "10px 20px",
                      background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                      border: "none", borderRadius: 10,
                      fontSize: 14, fontWeight: 600, color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Go to Projects
                  </button>
                </>
              ) : (
                <>
                  <ShieldCheck size={48} color="#475569" style={{ margin: "0 auto 16px" }} />
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary, #f8fafc)", margin: 0 }}>
                    No tasks found
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary, #cbd5e1)", marginTop: 8 }}>
                    {items.length === 0
                      ? 'Click "Generate Checklist" to seed security hardening requirements for this project.'
                      : "No tasks match your current filters. Try adjusting the filters above."}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
              {visible.map((it) => (
                <ChecklistCard key={it.checklist_id} item={it} onToggle={toggle} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
