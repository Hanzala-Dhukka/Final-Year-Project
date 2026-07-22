/**
 * Animated counter helper. Returns a MotionValue-driven formatter.
 * Usage is handled inside AnimatedCounter via useMotionValue + animate.
 */

/** Easing for counting up — slight overshoot-free linear-ish ease. */
export const COUNT_EASE = [0.22, 1, 0.36, 1];

/** Format helpers shared by counters and progress. */
export const formatNumber = (n) => Math.round(n).toLocaleString();

export const formatCompact = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(Math.round(n));
};
