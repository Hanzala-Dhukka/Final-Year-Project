import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  FlaskConical,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import gamificationApi from "../../api/gamificationApi";
import ThemeToggle from "../../components/Common/ThemeToggle";
import "./LearningGoals.css";

/**
 * Learning Goals (spec Step 17) — Module 7.5.
 * Users set targets (quizzes / glossary terms / OWASP labs per day|week) that
 * are tracked automatically from activity. Fully theme-aware (dark + light).
 */
const GOAL_TYPES = {
  quizzes: {
    label: "Quizzes",
    Icon: BookOpen,
    grad: "cs-lg-ig-violet",
    color: "#8b5cf6",
    desc: "Complete quiz challenges",
  },
  glossary_terms: {
    label: "Glossary Terms",
    Icon: BookMarked,
    grad: "cs-lg-ig-cyan",
    color: "#06b6d4",
    desc: "Review security glossary terms",
  },
  owasp_labs: {
    label: "OWASP Labs",
    Icon: FlaskConical,
    grad: "cs-lg-ig-amber",
    color: "#f59e0b",
    desc: "Complete OWASP labs",
  },
};

const PERIODS = [
  { value: "weekly", label: "Weekly", sub: "per week" },
  { value: "daily", label: "Daily", sub: "per day" },
];

export default function LearningGoals() {
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [goalType, setGoalType] = useState("quizzes");
  const [target, setTarget] = useState(5);
  const [period, setPeriod] = useState("weekly");
  const [creating, setCreating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const mounted = useRef(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [gRes, pRes] = await Promise.all([
        gamificationApi.goals().catch(() => ({ data: [] })),
        gamificationApi.progress().catch(() => null),
      ]);
      if (!mounted.current) return;
      setGoals(Array.isArray(gRes.data) ? gRes.data : []);
      setProgress(pRes?.data || null);
    } catch {
      if (!mounted.current) return;
      setError("Could not load your goals. Is the backend running?");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  /* ── Hero metrics ─────────────────────────────────────────── */
  const hero = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.completed).length;
    return {
      total,
      completed,
      rate: total ? Math.round((completed / total) * 100) : 0,
      streak: progress?.current_streak || 0,
      level: progress?.level || 1,
      xp: progress?.xp || 0,
    };
  }, [goals, progress]);

  const r = 48;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (circumference * hero.rate) / 100;

  const inProgress = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  /* ── Actions ──────────────────────────────────────────────── */
  const add = async () => {
    const t = Number(target);
    if (!Number.isFinite(t) || t <= 0) {
      toast.error("Please enter a target greater than 0");
      return;
    }
    setCreating(true);
    try {
      const res = await gamificationApi.createGoal({
        goal_type: goalType,
        target: Math.round(t),
        period,
      });
      setGoals((prev) => [res.data, ...prev]);
      toast.success(`${GOAL_TYPES[goalType].label} goal created — good luck!`);
      setTarget(period === "daily" ? 3 : 5);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create goal");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      await gamificationApi.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setConfirmId(null);
      toast.success("Goal deleted");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to delete goal");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cs-lg-wrap">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="cs-lg-top">
        <div className="cs-lg-brand">
          <div className="cs-lg-brand-icon">
            <Target size={20} />
          </div>
          <div>
            <h1>Learning Goals</h1>
            <p className="subtitle">Set targets and track progress automatically</p>
          </div>
        </div>
        <div className="cs-lg-top-spacer" />
        <button className="cs-lg-refresh" onClick={() => load(true)} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
        <ThemeToggle />
      </div>

      {loading ? (
        <div className="cs-lg-loading">
          <span className="cs-lg-spin" /> Loading your goals…
        </div>
      ) : (
        <>
          {error && (
            <div className="cs-lg-alert cs-lg-alert--error">
              <XCircle size={16} /> {error}
            </div>
          )}

          {/* ── Hero ──────────────────────────────────────────── */}
          <section className="cs-lg-hero">
            <div className="cs-lg-ring">
              <svg width="116" height="116">
                <defs>
                  <linearGradient id="csLgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <circle className="track" cx="58" cy="58" r={r} />
                <circle
                  className="value"
                  cx="58"
                  cy="58"
                  r={r}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="cs-lg-ring-center">
                <b>{hero.rate}%</b>
                <span>Overall</span>
              </div>
            </div>

            <div className="cs-lg-hero-info">
              <span className="eyebrow">
                <Sparkles size={13} /> Learning streak {hero.streak > 0 ? `· ${hero.streak} days` : ""}
              </span>
              <h2>Your learning targets</h2>
              <p className="sub">
                <b>{hero.completed} of {hero.total}</b> goals reached &nbsp;·&nbsp; Level {hero.level} · {hero.xp} XP
              </p>
              <div className="cs-lg-bar">
                <div className="cs-lg-bar-top">
                  <span>Overall completion</span>
                  <span>{hero.rate}%</span>
                </div>
                <div className="cs-lg-bar-track">
                  <div className="cs-lg-bar-fill" style={{ width: `${hero.rate}%` }} />
                </div>
              </div>
            </div>

            <div className="cs-lg-hero-stats">
              <div className="cs-lg-hero-stat">
                <b>{hero.total}</b>
                <span>Active</span>
              </div>
              <div className="cs-lg-hero-stat">
                <b>{hero.completed}</b>
                <span>Done</span>
              </div>
              <div className="cs-lg-hero-stat">
                <b>{inProgress.length}</b>
                <span>In run</span>
              </div>
            </div>
          </section>

          {/* ── Body: form + list ─────────────────────────────── */}
          <div className="cs-lg-body">
            <CreatePanel
              goalType={goalType}
              setGoalType={setGoalType}
              target={target}
              setTarget={setTarget}
              period={period}
              setPeriod={setPeriod}
              creating={creating}
              onCreate={add}
            />

            <div className="cs-lg-stack">
              {goals.length === 0 ? (
                <div className="cs-lg-empty">
                  <div className="big">🎯</div>
                  <h4>No learning goals yet</h4>
                  <p>
                    Use the form to set your first target. Your progress is
                    tracked automatically from quiz, glossary and lab activity.
                  </p>
                </div>
              ) : (
                <>
                  <GoalsSection
                    title="In Progress"
                    icon={<Target size={17} />}
                    goals={inProgress}
                    confirmId={confirmId}
                    deletingId={deletingId}
                    onConfirm={setConfirmId}
                    onCancel={() => setConfirmId(null)}
                    onDelete={remove}
                  />
                  {completedGoals.length > 0 && (
                    <GoalsSection
                      title="Completed"
                      icon={<CheckCircle2 size={17} />}
                      goals={completedGoals}
                      confirmId={confirmId}
                      deletingId={deletingId}
                      onConfirm={setConfirmId}
                      onCancel={() => setConfirmId(null)}
                      onDelete={remove}
                    />
                  )}
                </>
              )}

              <div className="cs-lg-tips">
                <div className="cs-lg-tip">
                  <Sparkles size={15} />
                  <span>
                    Consistency beats intensity — start with small targets you can hit
                    every single day.
                  </span>
                </div>
                <div className="cs-lg-tip">
                  <Shield size={15} />
                  <span>
                    Goals are refreshed from your latest activity, so completion always
                    reflects real progress.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Create panel ───────────────────────────────────────────────────────── */
function CreatePanel({ goalType, setGoalType, target, setTarget, period, setPeriod, creating, onCreate }) {
  return (
    <div className="cs-lg-create" id="new-goal-form">
      <div className="cs-lg-panel-head">
        <div className="icon">
          <Shield size={16} />
        </div>
        <h2>Create a New Goal</h2>
      </div>
      <p className="cs-lg-panel-sub">Pick an activity, set a target and choose how often.</p>

      <div className="cs-lg-field">
        <label className="cs-lg-label">Activity</label>
        <div className="cs-lg-types">
          {Object.entries(GOAL_TYPES).map(([key, meta]) => {
            const active = goalType === key;
            const Icon = meta.Icon;
            return (
              <button
                key={key}
                className={`cs-lg-type ${active ? "cs-lg-type--active" : ""}`}
                onClick={() => setGoalType(key)}
              >
                <span className={`cs-lg-type-icon ${meta.grad}`}>
                  <Icon size={17} />
                </span>
                <span className="cs-lg-type-body">
                  <b>{meta.label}</b>
                  <span>{meta.desc}</span>
                </span>
                <span className="cs-lg-type-check">
                  {active ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="cs-lg-field">
        <label className="cs-lg-label">Target</label>
        <div className="cs-lg-stepper">
          <button className="cs-lg-step-btn" onClick={() => setTarget((v) => Math.max(1, (Number(v) || 1) - 1))}>
            −
          </button>
          <input
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="cs-lg-step-input"
          />
          <button className="cs-lg-step-btn" onClick={() => setTarget((v) => (Number(v) || 0) + 1)}>
            +
          </button>
        </div>
      </div>

      <div className="cs-lg-field">
        <label className="cs-lg-label">Period</label>
        <div className="cs-lg-period">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`cs-lg-period-btn ${period === p.value ? "cs-lg-period-btn--active" : ""}`}
              onClick={() => setPeriod(p.value)}
            >
              <CalendarDays size={14} /> {p.label}
              <span style={{ fontWeight: 500, opacity: 0.8 }}>/ {p.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="cs-lg-submit" onClick={onCreate} disabled={creating}>
        {creating ? <Loader2 size={16} className="lg-spin" /> : <Target size={16} />}
        {creating ? "Creating…" : "Add Goal"}
      </button>
    </div>
  );
}

/* ── Goals section + card ───────────────────────────────────────────────── */
function GoalsSection({ title, icon, goals, onConfirm, onCancel, onDelete, confirmId, deletingId }) {
  return (
    <section>
      <div className="cs-lg-section">
        <h3>
          {icon} {title}
        </h3>
        <span className="count">{goals.length}</span>
        <div className="cs-lg-spacer" />
      </div>
      {goals.length === 0 ? (
        <div className="cs-lg-empty">Nothing here yet — keep going!</div>
      ) : (
        <div className="cs-lg-grid">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              confirmId={confirmId}
              deletingId={deletingId}
              onConfirm={onConfirm}
              onCancel={onCancel}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function GoalCard({ goal, confirmId, deletingId, onConfirm, onCancel, onDelete }) {
  const meta = GOAL_TYPES[goal.goal_type] || GOAL_TYPES.quizzes;
  const Icon = meta.Icon;
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const periodInfo = PERIODS.find((p) => p.value === goal.period) || PERIODS[0];

  const pr = 22;
  const pcirc = 2 * Math.PI * pr;
  const ringColor = goal.completed ? "#10b981" : meta.color;

  return (
    <div className={`cs-lg-card ${goal.completed ? "cs-lg-card--done" : ""}`}>
      <div className="cs-lg-card-top">
        <div className="cs-lg-card-left">
          <span className={`cs-lg-card-icon ${meta.grad}`}>
            <Icon size={19} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="cs-lg-card-title">
              {goal.target} × {meta.label}
            </p>
            <p className="cs-lg-card-period">
              <CalendarDays size={11} /> {periodInfo.sub}
            </p>
          </div>
        </div>

        {confirmId === goal.id ? (
          <span className="cs-lg-card-confirm">
            <button
              className="cs-lg-confirm-yes"
              onClick={() => onDelete(goal.id)}
              disabled={deletingId === goal.id}
            >
              {deletingId === goal.id ? <Loader2 size={13} className="lg-spin" /> : "Delete"}
            </button>
            <button className="cs-lg-confirm-no" onClick={onCancel}>
              No
            </button>
          </span>
        ) : (
          <button className="cs-lg-card-del" onClick={() => onConfirm(goal.id)} title="Delete goal">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="cs-lg-progress">
        <span className="cs-lg-porring">
          <svg width="56" height="56">
            <circle className="p-track" cx="28" cy="28" r={pr} />
            <circle
              className="p-value"
              cx="28"
              cy="28"
              r={pr}
              stroke={ringColor}
              strokeDasharray={pcirc}
              strokeDashoffset={pcirc - (pcirc * pct) / 100}
            />
          </svg>
          <span className="p-num">{pct}%</span>
        </span>
        <div className="cs-lg-progress-body">
          <div className="cs-lg-progress-meta">
            <span>
              {goal.current} / {goal.target} completed
            </span>
          </div>
          <div className="cs-lg-progress-track">
            <div
              className="cs-lg-progress-fill"
              style={{ width: `${Math.min(100, pct)}%`, background: ringColor }}
            />
          </div>
        </div>
      </div>

      <div className={`cs-lg-card-status ${goal.completed ? "cs-lg-card-status--ok" : "cs-lg-card-status--go"}`}>
        <CheckCircle2 size={14} />
        {goal.completed ? "Goal achieved — amazing work!" : `${Math.max(0, goal.target - goal.current)} to go — you've got this`}
      </div>
    </div>
  );
}