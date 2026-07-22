import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import "./Alert.css";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * CyberShield Alert
 * type: success | error | warning | info
 * dismissible → close button; action → custom node on the right.
 */
export default function Alert({
  type = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  className = "",
}) {
  const Icon = ICONS[type] || Info;
  return (
    <div className={`cs-alert cs-alert--${type} ${className}`} role="alert">
      <Icon className="cs-alert__icon" size={20} />
      <div className="cs-alert__body">
        {title && <div className="cs-alert__title">{title}</div>}
        {children && <div className="cs-alert__msg">{children}</div>}
      </div>
      {action && <div className="cs-alert__action">{action}</div>}
      {dismissible && (
        <button
          type="button"
          className="cs-alert__close"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
