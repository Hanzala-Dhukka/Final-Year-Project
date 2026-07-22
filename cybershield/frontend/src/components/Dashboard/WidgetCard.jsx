export default function WidgetCard({ title, children, className = "", icon, actions, favorite, onFavoriteToggle }) {
  return (
    <div className={`widget-card ${className}`}>
      <div className="widget-header">
        <div className="widget-title-row">
          {icon && <span className="widget-icon">{icon}</span>}
          <h3 className="widget-title">{title}</h3>
        </div>
        <div className="widget-actions">
          {favorite !== undefined && (
            <button
              className={`favorite-btn ${favorite ? "active" : ""}`}
              onClick={onFavoriteToggle}
              aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
            >
              {favorite ? "⭐" : "☆"}
            </button>
          )}
          {actions && actions.map((action, idx) => (
            <button key={idx} className="widget-action-btn" onClick={action.onClick}>
              {action.icon}
            </button>
          ))}
        </div>
      </div>
      <div className="widget-content">{children}</div>
    </div>
  );
}