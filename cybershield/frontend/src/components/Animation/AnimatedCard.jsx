import { motion } from "framer-motion";
import { cardHover } from "../../animations/hoverEffects";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * Hover-animated card: lifts 4px + subtle scale on hover. Shadow/border handled
 * via .cs-anim-card in Animation.css. Forwards ref + arbitrary props.
 */
const AnimatedCard = ({ as = "div", children, className = "", ...rest }) => {
  const reduce = useReducedMotionSafe();
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={`cs-anim-card ${className}`}
      initial="rest"
      whileHover={reduce ? undefined : "hover"}
      animate="rest"
      variants={cardHover}
      {...rest}
    >
      {children}
    </MotionTag>
  );
};

export default AnimatedCard;
