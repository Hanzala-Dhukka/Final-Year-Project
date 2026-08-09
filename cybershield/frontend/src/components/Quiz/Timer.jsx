import { useEffect, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";

/**
 * Countdown timer (spec Step 14). Calls onExpire when it reaches zero.
 * durationSec defaults to 10 minutes per quiz.
 */
export default function Timer({ durationSec = 600, onExpire, running = true }) {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    setRemaining(durationSec);
  }, [durationSec]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onExpire && onExpire();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, running, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const low = remaining <= 60;

  return (
    <span className={`cs-qz-timer ${low ? "cs-qz-timer--danger" : ""}`}>
      <TimerIcon size={15} />
      Time Left:
      <span className="cs-qz-timer__time">
        {mm}:{ss}
      </span>
    </span>
  );
}