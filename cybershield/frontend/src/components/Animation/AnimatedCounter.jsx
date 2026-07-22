import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { formatNumber, formatCompact } from "../../animations/counters";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * AnimatedCounter — counts up from 0 to `value` when scrolled into view.
 * suffix/prefix support; compact formatting option (e.g. 1.2k).
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1.2,
  prefix = "",
  suffix = "",
  compact = false,
  className = "",
  decimals = 0,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const fmt = compact ? formatCompact : formatNumber;
  const shown = decimals > 0 ? display.toFixed(decimals) : fmt(display);

  return (
    <span ref={ref} className={`cs-counter ${className}`}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
