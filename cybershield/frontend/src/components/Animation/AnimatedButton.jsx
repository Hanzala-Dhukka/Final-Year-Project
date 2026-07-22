import { motion } from "framer-motion";
import Button from "../ui/Button";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * AnimatedButton — the A3 Button with an extra framer-motion tap/hover micro
 * interaction (scale 1.02 on hover, 0.98 on press). All Button props pass through.
 */
export default function AnimatedButton({ children, ...props }) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.span
      style={{ display: "inline-flex" }}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
    >
      <Button {...props}>{children}</Button>
    </motion.span>
  );
}
