import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Returns true when the user prefers reduced motion.
 * Used to disable non-essential animation while keeping transitions instant.
 */
export function useReducedMotionSafe() {
  return useFramerReducedMotion();
}

export default useReducedMotionSafe;
