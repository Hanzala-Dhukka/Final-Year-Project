import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { toastEnter } from "../../animations/toasts";
import "./Animation.css";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

let idSeq = 0;

/** Wrap the app to enable useToast() anywhere. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info", opts = {}) => {
      const id = ++idSeq;
      const duration = opts.duration ?? 3500;
      setToasts((t) => [...t, { id, message, type, title: opts.title }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = {
    toast,
    success: (m, o) => toast(m, "success", o),
    error: (m, o) => toast(m, "error", o),
    warning: (m, o) => toast(m, "warning", o),
    info: (m, o) => toast(m, "info", o),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="cs-toast-stack" role="region" aria-live="polite" aria-label="Notifications">
          <AnimatePresence>
            {toasts.map((t) => {
              const Icon = ICONS[t.type] || Info;
              return (
                <motion.div
                  key={t.id}
                  className={`cs-toast cs-toast--${t.type}`}
                  variants={toastEnter}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  role="alert"
                >
                  <Icon className="cs-toast__icon" size={18} />
                  <div className="cs-toast__body">
                    {t.title && <div className="cs-toast__title">{t.title}</div>}
                    <div className="cs-toast__msg">{t.message}</div>
                  </div>
                  <button
                    className="cs-toast__close"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export default ToastProvider;
