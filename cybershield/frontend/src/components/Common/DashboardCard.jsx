export default function DashboardCard({
  title,
  children,
  className = ""
}) {
  return (
    <div className={`dashboard-card ${className}`}>
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
        </div>
      )}

      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
