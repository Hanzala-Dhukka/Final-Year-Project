import React, { useState } from "react";
import "./WidgetSelector.css";

const ALL_WIDGETS = [
  { id: "security",      name: "Security Score",         category: "Security" },
  { id: "vulnerability", name: "Vulnerability Chart",    category: "Security" },
  { id: "threat",        name: "Threat Distribution",    category: "Security" },
  { id: "heatmap",       name: "Threat Heatmap",         category: "Security" },
  { id: "weekly",        name: "Weekly Summary",         category: "Overview" },
  { id: "livefeed",      name: "Live Threat Feed",       category: "Live" },
  { id: "scanprogress",  name: "Live Scan Progress",     category: "Live" },
  { id: "notifications", name: "Notifications",          category: "Live" },
  { id: "systemhealth",  name: "System Health",          category: "Live" },
  { id: "timeline",      name: "Security Timeline",      category: "Live" },
  { id: "ai",            name: "AI Security Overview",   category: "AI" },
  { id: "ai-risk",       name: "AI Risk Score",          category: "AI" },
  { id: "ai-recs",       name: "AI Recommendations",     category: "AI" },
  { id: "ai-trend",      name: "AI Trend Analysis",      category: "AI" },
  { id: "ai-learning",   name: "AI Learning Path",       category: "AI" },
  { id: "ai-report",     name: "AI Executive Report",    category: "AI" },
  { id: "achievement",   name: "Achievements",           category: "Gamification" },
  { id: "learning",      name: "Learning Progress",      category: "Learning" },
  { id: "activity",      name: "Recent Activity",        category: "Activity" },
  { id: "quickactions",  name: "Quick Actions",          category: "Actions" },
];

export default function WidgetSelector({ hiddenWidgets = [], onToggle, onSave, className = "" }) {
  const [localHidden, setLocalHidden] = useState(hiddenWidgets || []);

  const handleToggle = (widgetId) => {
    setLocalHidden((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = () => {
    if (onSave) onSave(localHidden);
    if (onToggle) localHidden.forEach(onToggle);
  };

  const categories = [...new Set(ALL_WIDGETS.map((w) => w.category))];

  return (
    <div className={`widget-selector ${className}`}>
      <h4 className="selector-title">Widget Visibility</h4>
      <p className="selector-hint">Show or hide widgets on your dashboard</p>

      {categories.map((category) => (
        <div key={category} className="widget-category">
          <h5 className="category-title">{category}</h5>
          <div className="widget-list">
            {ALL_WIDGETS
              .filter((w) => w.category === category)
              .map((widget) => (
                <label key={widget.id} className="widget-checkbox">
                  <input
                    type="checkbox"
                    checked={!localHidden.includes(widget.id)}
                    onChange={() => handleToggle(widget.id)}
                  />
                  <span className="widget-name">{widget.name}</span>
                </label>
              ))}
          </div>
        </div>
      ))}

      {onSave && (
        <button className="save-btn" onClick={handleSave}>
          Save Changes
        </button>
      )}
    </div>
  );
}