import React from "react";
import "./ResetDashboard.css";

export default function ResetDashboard({ onReset, disabled = false, className = "" }) {
  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset the dashboard layout to defaults? This will also reset filters, hidden widgets, and favorites.")) {
      onReset();
    }
  };

  return (
    <button
      className={`reset-dashboard-btn ${className}`}
      onClick={handleReset}
      disabled={disabled}
      aria-label="Reset dashboard layout to defaults"
    >
      <span className="reset-icon">↺</span>
      Reset Layout
    </button>
  );
}