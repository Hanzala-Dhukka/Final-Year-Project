import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { loaderShield } from "../../animations/authAnimations";

/**
 * SecureLoader — replaces the plain "Loading…" with a branded secure-session
 * animation: a rotating shield ring + progress bar + status text.
 */
export default function SecureLoader({ label = "Authenticating Secure Session…" }) {
  return (
    <div className="secure-loader" role="status" aria-live="polite">
      <div className="secure-loader-shield">
        <motion.span className="secure-loader-ring" variants={loaderShield} animate="animate" />
        <Shield size={26} className="secure-loader-icon" />
        <Loader2 size={14} className="secure-loader-spin" />
      </div>
      <p className="secure-loader-label">{label}</p>
      <div className="secure-loader-bar">
        <motion.span
          className="secure-loader-fill"
          initial={{ width: "8%" }}
          animate={{ width: ["8%", "92%", "60%", "100%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
