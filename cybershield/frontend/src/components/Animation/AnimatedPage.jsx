import { motion } from "framer-motion";
import { pageEnter } from "../../animations/pageTransitions";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * Wraps a page with a fade + slide-up enter/exit for route transitions.
 * Respects reduced-motion (no transform, just opacity).
 */
export default function AnimatedPage({ children, className = "", style }) {
  const reduce = useReducedMotionSafe();
  const variants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : pageEnter;

  return (
    <motion.div
      className={className}
      style={style}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
