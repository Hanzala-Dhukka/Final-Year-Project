import { ArrowRight, Check } from "lucide-react";

const GOALS = [
  "Secure Coding",
  "OWASP",
  "API Security",
  "DevSecOps",
  "Cloud Security",
  "Threat Modeling",
  "Pen Testing",
  "GitHub Security",
  "Linux Security",
  "AI Security",
  "Compliance",
];

export default function GoalStep({ form, update, next }) {
  const toggle = (goal) => {
    const set = new Set(form.learning_goals);
    if (set.has(goal)) set.delete(goal);
    else set.add(goal);
    update({ learning_goals: Array.from(set) });
  };

  return (
    <div className="ob-step">
      <h2>What do you want to learn?</h2>
      <p className="ob-step-sub">
        Select all that apply — we&apos;ll prioritize these in your feed.
        ({form.learning_goals.length} selected)
      </p>

      <div className="ob-goal-grid">
        {GOALS.map((goal) => {
          const selected = form.learning_goals.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              className={"ob-goal-card" + (selected ? " selected" : "")}
              onClick={() => toggle(goal)}
            >
              {selected && (
                <span className="ob-goal-check">
                  <Check size={14} />
                </span>
              )}
              {goal}
            </button>
          );
        })}
      </div>

      <div className="ob-actions">
        <span className="ob-actions-spacer" />
        <button className="ob-btn-primary" onClick={next}>
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
