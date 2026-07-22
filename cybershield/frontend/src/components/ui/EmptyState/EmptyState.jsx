import "./EmptyState.css";

/**
 * CyberShield EmptyState — shown when no data exists.
 * icon: Lucide node; action: optional button/node.
 */
export default function EmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div className={`cs-empty ${className}`}>
      {icon && <div className="cs-empty__icon">{icon}</div>}
      {title && <h3 className="cs-empty__title">{title}</h3>}
      {description && <p className="cs-empty__desc">{description}</p>}
      {action && <div className="cs-empty__action">{action}</div>}
    </div>
  );
}
