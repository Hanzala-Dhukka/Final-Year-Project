import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";

export default function Welcome({ next }) {
  return (
    <div className="ob-welcome">
      <motion.div
        className="ob-welcome-badge"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 16 }}
      >
        <Shield size={44} />
      </motion.div>

      <h1>Welcome to CyberShield</h1>
      <p className="ob-lead">
        Your cybersecurity journey starts here. Let&apos;s take a minute to
        personalize your experience so we can tailor the right labs, scan
        targets, and learning paths for you.
      </p>

      <ul className="ob-welcome-points">
        <li>Build your security profile</li>
        <li>Pick your skill level</li>
        <li>Choose what you want to learn</li>
        <li>Get a quick tour of your dashboard</li>
      </ul>

      <button className="ob-btn-primary" onClick={next}>
        Start Setup <ArrowRight size={18} />
      </button>
    </div>
  );
}
