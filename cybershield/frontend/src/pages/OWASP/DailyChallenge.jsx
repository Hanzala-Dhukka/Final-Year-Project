import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, CalendarClock, Clock, Trophy, CheckCircle2 } from "lucide-react";
import owaspApi from "../../api/owaspApi";
import AttackMode from "./AttackMode";
import ProgressBar from "../../components/OWASP/ProgressBar";

function diffChipClass(d) {
  const map = {
    Beginner: "cs-ow-chip--easy",
    Intermediate: "cs-ow-chip--medium",
    Advanced: "cs-ow-chip--hard",
    Expert: "cs-ow-chip--danger",
  };
  return map[d] || "cs-ow-chip--neutral";
}

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Daily Challenge (spec Step 9). Shows today's challenge with a live countdown;
 * the reward is granted once per day. On "Start", opens AttackMode for the
 * challenge's vulnerability.
 */
export default function DailyChallenge({ onBack }) {
  const [challenge, setChallenge] = useState(null);
  const [launch, setLaunch] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgError, setMsgError] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(() => {
    owaspApi
      .daily()
      .then((r) => mounted.current && setChallenge(r.data))
      .catch(() => mounted.current && setChallenge(null));
  }, []);

  useEffect(() => {
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const remaining = useCountdown(challenge?.expires_at);

  const complete = async () => {
    setMsgError(false);
    try {
      const r = await owaspApi.completeDaily();
      const xp = r.data?.xp_awarded || 0;
      setMsg(xp > 0 ? `Daily challenge complete! +${xp} XP awarded.` : "You already completed today's challenge.");
      load();
    } catch (e) {
      setMsgError(true);
      setMsg("Could not complete the challenge. Please try again.");
    }
  };

  if (launch && challenge) {
    return (
      <AttackMode
        initialLab={challenge.vulnerability}
        onBack={() => setLaunch(false)}
        onComplete={complete}
      />
    );
  }

  return (
    <div className="cs-ow-wrap">
      <button className="cs-ow-back" onClick={onBack}>
        <ArrowLeft size={15} /> Back
      </button>

      {!challenge ? (
        <div className="cs-ow-loading">
          <span className="cs-ow-spin" /> Loading today&apos;s challenge…
        </div>
      ) : (
        <div className="cs-ow-daily">
          <span className="cs-ow-daily-eyebrow">
            <CalendarClock size={14} /> Today&apos;s Challenge
          </span>

          <div className="cs-ow-daily-head">
            <h2>{challenge.vulnerability}</h2>
            <span className="cs-ow-countdown">
              <Clock size={15} /> {formatTime(remaining)}
            </span>
          </div>

          <div className="cs-ow-daily-meta">
            <span className={`cs-ow-chip ${diffChipClass(challenge.difficulty)}`}>
              {challenge.difficulty}
            </span>
            <span className="cs-ow-chip cs-ow-chip--warning">
              <Trophy size={11} /> Reward {challenge.reward_xp} XP
            </span>
          </div>

          <ProgressBar value={remaining} max={86400000} label="Expires in" />

          {challenge.completed ? (
            <div className="cs-ow-daily-done">
              <CheckCircle2 size={18} /> Completed today — you earned the reward!
            </div>
          ) : (
            <div className="cs-ow-daily-note">
              <button
                className="cs-ow-btn cs-ow-btn--primary"
                onClick={() => setLaunch(true)}
              >
                <Trophy size={16} /> Start Challenge
              </button>
            </div>
          )}

          {msg && (
            <div className={`cs-ow-alert ${msgError ? "cs-ow-alert--error" : "cs-ow-alert--info"}`} style={{ marginTop: 16 }}>
              {msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}