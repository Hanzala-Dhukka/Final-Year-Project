import { useState, useEffect, useMemo } from "react";
import checklistApi from "../../api/checklistApi";
import projectApi from "../../api/projectApi";
import ChecklistCard from "../../components/Checklist/ChecklistCard";
import ChecklistProgress from "../../components/Checklist/ChecklistProgress";
import ChecklistFilter from "../../components/Checklist/ChecklistFilter";
import ChecklistCategory from "../../components/Checklist/ChecklistCategory";

/**
 * Security Hardening Checklist page (Module 6.1).
 *
 * Workflow: select a project -> load its security requirements -> complete
 * tasks -> update the security score -> see AI-style recommendations.
 */
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
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [severity, setSeverity] = useState("All");
  const [category, setCategory] = useState("All");

  // ── Load projects for the selector ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await projectApi.list();
        const list = res.data?.projects || res.data || [];
        setProjects(Array.isArray(list) ? list : []);
        if (list.length) setProjectId(String(list[0].id ?? list[0]._id));
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    })();
  }, []);

  // ── Load checklist + score when project changes ───────────────────────────
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

  useEffect(() => {
    loadChecklist(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Generate project checklist (seed default catalogue) ───────────────────
  const generate = async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      await checklistApi.generateChecklist(projectId, {});
      await loadChecklist(projectId);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to generate checklist.");
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle a task's status ────────────────────────────────────────────────
  const toggle = async (item) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    // Optimistic update
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
    } catch (e) {
      setItems(prev);
      setError(e.response?.data?.detail || "Failed to update status.");
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">🛡️ Security Hardening</h1>
        <div className="flex items-center gap-2">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map((p) => (
              <option key={p.id ?? p._id} value={String(p.id ?? p._id)}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Checklist
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {score && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <ChecklistProgress
              score={score.score}
              completed={score.completed_tasks}
              total={score.total_tasks}
            />
          </div>
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
            <p className="font-semibold text-gray-700 mb-3">Categories</p>
            {score.by_category.map((c) => (
              <ChecklistCategory
                key={c.category}
                category={c.category}
                total={c.total}
                completed={c.completed}
                score={c.score}
              />
            ))}
            {score.by_category.length === 0 && (
              <p className="text-gray-400 text-sm">No data yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <ChecklistFilter
            categories={categories}
            severity={severity}
            category={category}
            onSeverity={setSeverity}
            onCategory={setCategory}
          />
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <p className="text-gray-400">Loading checklist…</p>
          ) : visible.length === 0 ? (
            <p className="text-gray-400">
              No tasks. Click “Generate Checklist” to seed the security
              hardening requirements for this project.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visible.map((it) => (
                <ChecklistCard key={it.checklist_id} item={it} onToggle={toggle} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
