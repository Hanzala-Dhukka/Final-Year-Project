import { useState, useEffect, useMemo } from "react";
import aiChecklistApi from "../../api/aiChecklistApi";
import { projectApi } from "../../api/projectApi";
import ChecklistSummary from "../../components/Checklist/ChecklistSummary";
import AIChecklistCard from "../../components/Checklist/AIChecklistCard";
import ProgressTracker from "../../components/Checklist/ProgressTracker";
import PriorityBadge from "../../components/Checklist/PriorityBadge";

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/**
 * AI Security Checklist page (Module 6.2).
 *
 * Workflow: select project -> generate (Gemini) -> view prioritised plan with
 * risk reduction, difficulty, time -> mark tasks complete -> regenerate.
 */
export default function AIChecklist() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      const res = await projectApi.list();
      const list = res.data?.projects || res.data || [];
      setProjects(Array.isArray(list) ? list : []);
      if (list.length) setProjectId(String(list[0].id ?? list[0]._id));
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadLatest = async (pid) => {
    if (!pid) return;
    setLoading(true);
    setError("");
    try {
      const res = await aiChecklistApi.getLatest(pid);
      setChecklist(res.data);
    } catch (e) {
      // 404 is expected when no checklist exists yet
      if (e.response?.status === 404) {
        setChecklist(null);
      } else {
        setError(e.response?.data?.detail || "Failed to load checklist.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatest(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const generate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError("");
    try {
      const res = await aiChecklistApi.generate(projectId);
      setChecklist(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to generate checklist.");
    } finally {
      setGenerating(false);
    }
  };

  const regenerate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError("");
    try {
      const res = await aiChecklistApi.regenerate(projectId);
      setChecklist(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to regenerate checklist.");
    } finally {
      setGenerating(false);
    }
  };

  const toggle = async (index) => {
    if (!checklist) return;
    const item = checklist.items[index];
    const next = !item.completed;
    // Optimistic update
    const prev = checklist;
    setChecklist((c) => ({
      ...c,
      items: c.items.map((it, i) => (i === index ? { ...it, completed: next } : it)),
    }));
    try {
      await aiChecklistApi.markItem(checklist.id, index, next);
    } catch (e) {
      setChecklist(prev);
      setError(e.response?.data?.detail || "Failed to update task.");
    }
  };

  const stats = useMemo(() => {
    if (!checklist) return { completed: 0, total: 0 };
    const total = checklist.items.length;
    const completed = checklist.items.filter((i) => i.completed).length;
    return { completed, total };
  }, [checklist]);

  // Group tasks by priority, keeping global priority order
  const grouped = useMemo(() => {
    if (!checklist) return [];
    const order = ["Critical", "High", "Medium", "Low"];
    const map = {};
    for (const it of checklist.items) {
      (map[it.priority] = map[it.priority] || []).push(it);
    }
    return order
      .filter((p) => map[p])
      .map((p) => ({ priority: p, items: map[p] }));
  }, [checklist]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">🤖 AI Security Checklist</h1>
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
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
          <button
            onClick={regenerate}
            disabled={generating || !checklist}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Regenerate
          </button>
        </div>
      </div>

      {generating && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm">
          🤖 Gemini is analysing your project data and building a prioritised plan…
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!checklist && !loading && !generating && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          <p>No AI checklist yet for this project.</p>
          <p className="text-sm mt-1">
            Click <span className="font-semibold text-gray-600">Generate</span> to let
            Gemini build a project-specific security plan from your scans, threat
            report and tech stack.
          </p>
        </div>
      )}

      {checklist && (
        <>
          <ChecklistSummary
            aiSummary={checklist.ai_summary}
            riskScore={checklist.risk_score}
            estimatedRisk={checklist.estimated_risk_after}
          />

          <ProgressTracker completed={stats.completed} total={stats.total} />

          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.priority}>
                <div className="flex items-center gap-2 mb-2">
                  <PriorityBadge priority={group.priority} />
                  <span className="text-sm text-gray-500">
                    {group.items.length} task(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map((it) => (
                    <AIChecklistCard
                      key={`${it.title}-${checklist.items.indexOf(it)}`}
                      item={it}
                      index={checklist.items.indexOf(it)}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
