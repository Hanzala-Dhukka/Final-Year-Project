import { useState, useEffect } from "react";
import { LinearProgress, CircularProgress } from "../ui/Progress";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * AnimatedProgress — the UI Progress bars, animated up to `value` on mount.
 * type: "linear" | "circular"
 */
export default function AnimatedProgress({ type = "linear", value = 0, ...rest }) {
  const reduce = useReducedMotionSafe();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value, reduce]);

  return type === "circular" ? (
    <CircularProgress value={shown} {...rest} />
  ) : (
    <LinearProgress value={shown} {...rest} />
  );
}
