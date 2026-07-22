import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { shieldPulse } from "../../animations/authAnimations";

/**
 * AnimatedShield — the brand shield with a gentle glow + pulse loop.
 * Used in the login branding panel as the premium brand identity mark.
 */
export default function AnimatedShield({ size = 56 }) {
  return (
    <motion.div
      className="animated-shield"
      variants={shieldPulse}
      animate="animate"
      role="img"
      aria-label="CyberShield secure"
    >
      <span className="animated-shield-ring" />
      <Shield size={size} className="animated-shield-icon" strokeWidth={1.75} />
    </motion.div>
  );
}
