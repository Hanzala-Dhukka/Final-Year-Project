import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { overlayFade, drawerRight, drawerLeft, drawerTop, drawerBottom, EASE } from "../animations";
import "./Drawer.css";

const VARIANTS = { right: drawerRight, left: drawerLeft, top: drawerTop, bottom: drawerBottom };

/**
 * CyberShield Drawer — side panel (mobile nav, filters, AI assistant, etc.)
 * placement: left | right | top | bottom
 */
export default function Drawer({ open, onClose, title, children, footer, placement = "right", size = 380 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const dim =
    placement === "top" || placement === "bottom"
      ? { height: size }
      : { width: size };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="cs-drawer__overlay"
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className={`cs-drawer cs-drawer--${placement}`}
            variants={VARIANTS[placement] || drawerRight}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.3, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={dim}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cs-drawer__header">
              <h3 className="cs-drawer__title">{title}</h3>
              {onClose && (
                <button type="button" className="cs-drawer__close" onClick={onClose} aria-label="Close panel">
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="cs-drawer__body">{children}</div>
            {footer && <div className="cs-drawer__footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
