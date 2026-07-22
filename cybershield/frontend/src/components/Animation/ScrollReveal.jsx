import { motion } from "framer-motion";
import { slideUp } from "../../animations/variants";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * ScrollReveal — subtle fade + slide as the element enters the viewport.
 * `delay` staggers sibling reveals. Respects reduced motion.
 */
export default function ScrollReveal({ children, delay = 0, className = "", as = "div", ...rest }) {
  const reduce = useReducedMotionSafe();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    return (
      <MotionTag className={className} {...rest}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={className}
      variants={slideUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10%" }}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
