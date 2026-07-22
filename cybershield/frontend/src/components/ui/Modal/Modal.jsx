import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { overlayFade, scaleIn, EASE } from "../animations";
import "./Modal.css";

/**
 * CyberShield Modal
 * Overlay + animation, ESC to close, click-outside to close, scrollable body,
 * optional header/footer. Focus is moved into the dialog on open.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="cs-modal__overlay"
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={() => closeOnOverlay && onClose?.()}
        >
          <motion.div
            ref={panelRef}
            className={`cs-modal cs-modal--${size}`}
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.2, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || onClose) && (
              <div className="cs-modal__header">
                <h3 className="cs-modal__title">{title}</h3>
                {onClose && (
                  <button
                    type="button"
                    className="cs-modal__close"
                    onClick={onClose}
                    aria-label="Close dialog"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className="cs-modal__body">{children}</div>
            {footer && <div className="cs-modal__footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
