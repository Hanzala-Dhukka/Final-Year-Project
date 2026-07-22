import React from "react";
import "./DashboardFilters.css";

export default function DashboardFilters({ filters, setFilters, className = "" }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`dashboard-filters ${className}`}>
      <div className="filter-group">
        <label htmlFor="filter-project" className="filter-label">Project</label>
        <select
          id="filter-project"
          value={filters.project}
          onChange={(e) => handleChange("project", e.target.value)}
          className="filter-select"
        >
          <option value="All">All Projects</option>
          <option value="Project A">Project A</option>
          <option value="Project B">Project B</option>
          <option value="Project C">Project C</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-severity" className="filter-label">Severity</label>
        <select
          id="filter-severity"
          value={filters.severity}
          onChange={(e) => handleChange("severity", e.target.value)}
          className="filter-select"
        >
          <option value="All">All Severity</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
          <option value="Info">Info</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-date" className="filter-label">Date Range</label>
        <select
          id="filter-date"
          value={filters.date}
          onChange={(e) => handleChange("date", e.target.value)}
          className="filter-select"
        >
          <option value="7 Days">Last 7 Days</option>
          <option value="30 Days">Last 30 Days</option>
          <option value="90 Days">Last 90 Days</option>
          <option value="All Time">All Time</option>
        </select>
      </div>
    </div>
  );
}