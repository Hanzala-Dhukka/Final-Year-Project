import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Trophy,
  Medal,
  Flame,
  Zap,
  Target,
  Database,
  ShieldCheck,
  Bug,
  Compass,
  Award,
  Brain,
  GraduationCap,
  Shield,
  BookOpen,
  Flag,
  RefreshCw,
  Star,
  Lock,
  Timer,
  Download,
  BadgeCheck,
  TrendingUp,
  FileBadge,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import gamificationApi from "../../api/gamificationApi";
import ThemeToggle from "../../components/Common/ThemeToggle";
import "./Achievements.css";

/**
 * Achievement key → lucide icon + gradient accent
 */
const ACH_ICONS = {
  first_blood: { Icon: Flag, cls: "cs-ach-stat-icon--rose" },
  sql_hunter: { Icon: Database, cls: "cs-ach-stat-icon--blue" },
  xss_defender: { Icon: ShieldCheck, cls: "cs-ach-stat-icon--emerald" },
  injection_master: { Icon: Bug, cls: "cs-ach-stat-icon--violet" },
  daily_warrior: { Icon: Flame, cls: "cs-ach-stat-icon--amber" },
  cyber_explorer: { Icon: Compass, cls: "cs-ach-stat-icon--cyan" },
  perfect_defender: { Icon: ShieldCheck, cls: "cs-ach-stat-icon--emerald" },
  ai_learner: { Icon: Brain, cls: "cs-ach-stat-icon--violet" },
  quiz_champion: { Icon: GraduationCap, cls: "cs-ach-stat-icon--blue" },
  security_professional: { Icon: Shield, cls: "cs-ach-stat-icon--rose" },
  streak_master: { Icon: Zap, cls: "cs-ach-stat-icon--amber" },
  level_10: { Icon: Trophy, cls: "cs-ach-stat-icon--violet" },
};

function achievementDef(key) {
  return ACH_ICONS[key] || { Icon: Medal, cls: "cs-ach-stat-icon--blue" };
}

const ACTIVITY_META = {
  lab_completed: { Icon: Flag, cls: "cs-ach-tl-dot" },
  attack_lab: { Icon: Bug, cls: "cs-ach-tl-dot" },
  defense_lab: { Icon: Shield, cls: "cs-ach-tl-dot--success" },
  owasp_lab: { Icon: Bug, cls: "cs-ach-tl-dot" },
  quiz: { Icon: GraduationCap, cls: "cs-ach-tl-dot--violet" },
  quiz_completed: { Icon: GraduationCap, cls: "cs-ach-tl-dot--violet" },
  glossary: { Icon: BookOpen, cls: "cs-ach-tl-dot--violet" },
  badge: { Icon: Trophy, cls: "cs-ach-tl-dot--amber" },
  level_up: { Icon: Zap, cls: "cs-ach-tl-dot--violet" },
  certificate: { Icon: FileBadge, cls: "cs-ach-tl-dot--success" },
  perfect_score: { Icon: Star, cls: "cs-ach-tl-dot--amber" },
  streak: { Icon: Flame, cls: "cs-ach-tl-dot--amber" },
  default: { Icon: Sparkles, cls: "cs-ach-tl-dot--violet" },
};

function activityMeta(type) {
  return ACTIVITY_META[type] || ACTIVITY_META.default;
}

export default function Achievements() {
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [downloading, setDownloading] = useState(null);
  const mounted = useRef(true);

  const load = useCallback(() => {
    setError("");
    Promise.all([
      gamificationApi.progress().catch(() => null),
      gamificationApi.achievements().catch(() => []),
      gamificationApi.badges().catch(() => []),
      gamificationApi.certificates().catch(() => []),
      gamificationApi.activity(20).catch(() => []),
    ])
      .then(([p, a, b, c, act]) => {
        if (!mounted.current) return;
        setProgress(p?.data || null);
        setAchievements(a?.data || []);
        setBadges(b?.data || []);
        setCertificates(c?.data || []);
        setActivity(act?.data || []);
      })
      .catch(() => {
        if (!mounted.current) return;
        setError("Could not load achievements. Is the backend running?");
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const download = async (id, course) => {
    setDownloading(id);
    try {
      const r = await gamificationApi.downloadCertificate(id);
      const url = window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${course || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError("Failed to download certificate.");
    } finally {
      setDownloading(null);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "unlocked") return achievements.filter((a) => a.unlocked);
    if (filter === "locked") return achievements.filter((a) => !a.unlocked);
    return achievements;
  }, [achievements, filter]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const levelProgress = Math.min(100, Math.max(0, progress?.level_progress || 0));
  const dashOffset = circumference - (circumference * levelProgress) / 100;

  const statCards = progress
    ? [
        { icon: Flame, cls: "cs-ach-stat-icon--amber", label: "Day streak", value: progress.current_streak ?? 0 },
        { icon: Zap, cls: "cs-ach-stat-icon--rose", label: "Longest streak", value: progress.longest_streak ?? 0 },
        { icon: Bug, cls: "cs-ach-stat-icon--blue", label: "Labs completed", value: progress.completed_labs ?? 0 },
        { icon: GraduationCap, cls: "cs-ach-stat-icon--violet", label: "Quizzes done", value: progress.completed_quizzes ?? 0 },
        { icon: BookOpen, cls: "cs-ach-stat-icon--cyan", label: "Glossary terms", value: progress.completed_glossary ?? 0 },
        { icon: Shield, cls: "cs-ach-stat-icon--emerald", label: "Security score", value: `${progress.security_score ?? 0}/100` },
      ]
    : [];

  return (
    <div className="cs-ach-wrap">
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="cs-ach-top">
        <div className="cs-ach-brand">
          <h1>
            <Trophy size={20} style={{ verticalAlign: "-3px", color: "var(--primary, #2563eb)" }} />{" "}
            Achievements
          </h1>
          <p className="subtitle">Track your XP, levels, badges, and milestones</p>
        </div>
        <div className="cs-ach-top-spacer" />
        <button className="cs-ach-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
        <ThemeToggle />
      </div>

      {loading && (
        <div className="cs-ach-loading">
          <span className="cs-ach-spin" /> Loading your achievements…
        </div>
      )}

      {error && !loading && (
        <div className="cs-ach-alert cs-ach-alert--error">
          <XCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── Hero ─────────────────────────────────────── */}
          {progress && (
            <section className="cs-ach-hero">
              <div className="cs-ach-ring">
                <svg width="108" height="108">
                  <defs>
                    <linearGradient id="csAchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <circle className="track" cx="54" cy="54" r={r} />
                  <circle
                    className="value"
                    cx="54"
                    cy="54"
                    r={r}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className="cs-ach-ring-center">
                  <b>{progress.level ?? 1}</b>
                  <span>Level</span>
                </div>
              </div>

              <div className="cs-ach-hero-info">
                <span className="eyebrow">
                  <Sparkles size={13} /> {progress.level_title || "Beginner"}
                </span>
                <h2>Security Level {progress.level}</h2>
                <p className="xp-line">
                  <b>{progress.xp ?? 0} XP</b> earned ·{" "}
                  {progress.xp_to_next > 0
                    ? `${progress.xp_to_next} XP to level ${progress.level + 1}`
                    : "Max level reached"}
                </p>
                <div className="cs-ach-bar">
                  <div className="cs-ach-bar-top">
                    <span>Level progress</span>
                    <span>{Math.round(levelProgress)}%</span>
                  </div>
                  <div className="cs-ach-bar-track">
                    <div className="cs-ach-bar-fill" style={{ width: `${levelProgress}%` }} />
                  </div>
                </div>
              </div>

              <div className="cs-ach-hero-stats">
                <div className="cs-ach-hero-stat">
                  <b>{progress.badges ?? 0}</b>
                  <span>Badges</span>
                </div>
                <div className="cs-ach-hero-stat">
                  <b>{progress.certificates ?? 0}</b>
                  <span>Certs</span>
                </div>
                <div className="cs-ach-hero-stat">
                  <b>{achievements.length}</b>
                  <span>Achievements</span>
                </div>
              </div>
            </section>
          )}

          {/* ── Stat cards ───────────────────────────────── */}
          {statCards.length > 0 && (
            <section className="cs-ach-stats">
              {statCards.map((s) => {
                const Icon = s.icon;
                return (
                  <div className="cs-ach-stat-card" key={s.label}>
                    <div className={`cs-ach-stat-icon ${s.cls}`}>
                      <Icon size={20} />
                    </div>
                    <div className="cs-ach-stat-body">
                      <b>{s.value}</b>
                      <span>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* ── Achievements grid ─────────────────────────── */}
          <div className="cs-ach-section">
            <h3>
              <Trophy size={18} style={{ color: "var(--primary, #2563eb)" }} /> Achievements
            </h3>
            <span className="count">
              {unlockedCount} / {achievements.length} unlocked
            </span>
            <div className="cs-ach-spacer" />
            <div className="cs-ach-tabs">
              {["all", "unlocked", "locked"].map((f) => (
                <button
                  key={f}
                  className={`cs-ach-tab ${filter === f ? "cs-ach-tab--active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "unlocked" ? "Unlocked" : "Locked"}
                </button>
              ))}
            </div>
          </div>

          <div className="cs-ach-grid">
            {filtered.length === 0 ? (
              <div className="cs-ach-empty">
                No achievements in this view yet.
              </div>
            ) : (
              filtered.map((a) => {
                const def = achievementDef(a.key);
                const Icon = def.Icon;
                return (
                  <div
                    key={a.key}
                    className={`cs-ach-card ${a.unlocked ? "cs-ach-card--unlocked" : "cs-ach-card--locked"}`}
                  >
                    <div className={`cs-ach-card-icon ${def.cls}`}>
                      {a.unlocked ? <Icon size={24} /> : <Lock size={22} />}
                    </div>
                    <h4>{a.name}</h4>
                    <p>{a.description}</p>
                    <div className="cs-ach-card-meta">
                      <span className="cs-ach-xp">
                        <Sparkles size={12} /> +{a.xp_reward ?? 0} XP
                      </span>
                      {a.unlocked ? (
                        <span className="cs-ach-state cs-ach-state--unlocked">
                          <BadgeCheck size={14} /> Unlocked
                        </span>
                      ) : (
                        <span className="cs-ach-state cs-ach-state--locked">
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Badges ────────────────────────────────────── */}
          <div className="cs-ach-section">
            <h3>
              <Medal size={18} style={{ color: "var(--primary, #2563eb)" }} /> Badges
            </h3>
            <span className="count">{badges.filter((b) => b.unlocked).length} earned</span>
          </div>
          {badges.length === 0 ? (
            <div className="cs-ach-empty">
              No badges yet — complete labs and quizzes to earn some.
            </div>
          ) : (
            <div className="cs-ach-badge-row">
              {badges.map((b) => (
                <span
                  key={b.key}
                  className={`cs-ach-badge ${b.unlocked ? "cs-ach-badge--unlocked" : "cs-ach-badge--locked"}`}
                >
                  {b.unlocked ? <BadgeCheck size={15} /> : <Lock size={13} />}
                  {b.name}
                </span>
              ))}
            </div>
          )}

          {/* ── Certificates ──────────────────────────────── */}
          <div className="cs-ach-section">
            <h3>
              <FileBadge size={18} style={{ color: "var(--primary, #2563eb)" }} /> Certificates
            </h3>
            <span className="count">{certificates.length} issued</span>
          </div>
          {certificates.length === 0 ? (
            <div className="cs-ach-empty">
              No certificates yet — complete a learning path to earn one.
            </div>
          ) : (
            <div className="cs-ach-cert-grid">
              {certificates.map((c) => (
                <div className="cs-ach-cert" key={c.certificate_id}>
                  <div className="cs-ach-cert-icon">
                    <FileBadge size={22} />
                  </div>
                  <h4>{c.course || "Certificate of Achievement"}</h4>
                  <p className="cert-meta">
                    <Shield size={12} /> {c.user_name || "CyberShield User"}
                  </p>
                  <p className="cert-meta">
                    <Timer size={12} />
                    {c.issued_at ? new Date(c.issued_at).toLocaleDateString() : "Issued"}
                  </p>
                  <span className="cert-score">
                    <TrendingUp size={14} /> Score: {c.score ?? 0}%
                  </span>
                  <button
                    className="cs-ach-download"
                    onClick={() => download(c.certificate_id, c.course)}
                    disabled={downloading === c.certificate_id}
                  >
                    <Download size={15} />
                    {downloading === c.certificate_id ? "Downloading…" : "Download PDF"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Activity timeline ─────────────────────────── */}
          <div className="cs-ach-section">
            <h3>
              <Zap size={18} style={{ color: "var(--primary, #2563eb)" }} /> Recent Activity
            </h3>
            <span className="count">{activity.length} events</span>
          </div>
          {activity.length === 0 ? (
            <div className="cs-ach-empty">
              No activity yet — your recent XP events will appear here.
            </div>
          ) : (
            <div className="cs-ach-panel">
              <div className="cs-ach-timeline">
                {activity.map((ev) => {
                  const meta = activityMeta(ev.activity_type);
                  const Icon = meta.Icon;
                  return (
                    <div className="cs-ach-tl-item" key={ev.id}>
                      <div className={`cs-ach-tl-dot ${meta.cls}`}>
                        <Icon size={16} />
                      </div>
                      <div className="cs-ach-tl-body">
                        <div className="desc">{ev.description}</div>
                        <div className="sub">
                          {ev.created_at ? new Date(ev.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                      {ev.xp > 0 && (
                        <span className="cs-ach-tl-xp">
                          <Sparkles size={13} /> +{ev.xp} XP
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}