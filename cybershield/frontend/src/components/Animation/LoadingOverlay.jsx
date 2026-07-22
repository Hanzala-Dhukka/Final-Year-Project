import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "../ui";
import { overlayIn } from "../../animations/loaders";
import "./Animation.css";

/**
 * LoadingOverlay — blurs the background and shows an animated loader with an
 * optional progress message. Use for long ops (scan, report gen, AI, export).
 */
export default function LoadingOverlay({ open, message, label, size = "lg" }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="cs-loading-overlay"
          variants={overlayIn}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <div className="cs-loading-overlay__panel">
            <Spinner size={size} label={label} />
            {message && <p className="cs-loading-overlay__msg">{message}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
