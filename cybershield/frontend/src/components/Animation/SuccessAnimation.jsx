import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { EASE } from "../../animations/variants";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import "./Animation.css";

const CIRCLE = 52;

/**
 * SuccessAnimation — animated checkmark circle (SVG draw) with optional XP badge.
 * Used after quiz/lab/scan completion.
 */
export default function SuccessAnimation({ xp, label, size = 96 }) {
  const reduce = useReducedMotionSafe();
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="cs-success" style={{ textAlign: "center" }}>
      <motion.div
        className="cs-success__ring"
        style={{ width: size, height: size }}
        initial={reduce ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--success, #10b981)"
            strokeWidth="4"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
          />
          <motion.path
            d={`M ${size * 0.35} ${size * 0.52} L ${size * 0.45} ${size * 0.63} L ${size * 0.66} ${size * 0.4}`}
            fill="none"
            stroke="var(--success, #10b981)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: EASE, delay: reduce ? 0 : 0.4 }}
          />
        </svg>
      </motion.div>
      {xp != null && (
        <motion.div
          className="cs-success__xp"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.6, duration: 0.3 }}
        >
          +{xp} XP
        </motion.div>
      )}
      {label && <p className="cs-success__label">{label}</p>}
    </div>
  );
}

export { CIRCLE };
