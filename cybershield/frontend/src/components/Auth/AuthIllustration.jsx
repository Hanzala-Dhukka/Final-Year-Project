import { motion } from "framer-motion";
import { ShieldCheck, Bug, Lock } from "lucide-react";

/**
 * AuthIllustration — branded left panel for the auth screens.
 * Floating animated shield + security glyphs on a radial glow.
 */
export default function AuthIllustration() {
  return (
    <div className="auth-left">
      <motion.div
        className="shield-animation"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <ShieldCheck size={120} />
      </motion.div>

      <h1>CyberShield</h1>
      <h3>Security Platform</h3>

      <div className="floating-icons">
        <Bug />
        <Lock />
        <ShieldCheck />
      </div>
    </div>
  );
}
