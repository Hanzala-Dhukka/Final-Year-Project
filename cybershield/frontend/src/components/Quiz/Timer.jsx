import { useEffect, useState } from "react";

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

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">Time Left</span>
      <span
        className={`font-mono font-semibold ${
          remaining <= 60 ? "text-red-500" : "text-gray-700"
        }`}
      >
        {mm}:{ss}
      </span>
    </div>
  );
}
