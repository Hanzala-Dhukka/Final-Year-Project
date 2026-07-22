import { Loader2 } from "lucide-react";
import "./feedback.css";

/**
 * CyberShield Spinner. size: sm | md | lg | fullscreen
 */
export default function Spinner({ size = "md", label, className = "" }) {
  if (size === "fullscreen") {
    return (
      <div className={`cs-spinner-fullscreen ${className}`} role="status" aria-live="polite">
        <Loader2 className="cs-spin" size={40} />
        {label && <p className="cs-spinner-label">{label}</p>}
      </div>
    );
  }
  const px = size === "sm" ? 16 : size === "lg" ? 32 : 22;
  return (
    <span className={`cs-spinner ${className}`} role="status" aria-label={label || "Loading"}>
      <Loader2 className="cs-spin" size={px} />
    </span>
  );
}
