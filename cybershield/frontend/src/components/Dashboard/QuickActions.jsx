import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-card">
      <h2>Quick Actions</h2>
      <div className="quick-actions">
        <button onClick={() => navigate("/security-scanner")}>
          Scan Repository
        </button>
        <button onClick={() => navigate("/threat-analysis")}>
          Create Threat Model
        </button>
        <button onClick={() => navigate("/owasp")}>
          Start OWASP Lab
        </button>
      </div>
    </div>
  );
}