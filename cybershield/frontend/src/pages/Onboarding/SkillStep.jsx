import { ArrowRight, Check } from "lucide-react";

const LEVELS = [
  {
    value: "Beginner",
    desc: "New to cybersecurity — start with the fundamentals.",
  },
  {
    value: "Intermediate",
    desc: "Comfortable with the basics, building real skills.",
  },
  {
    value: "Advanced",
    desc: "Hands-on experience across multiple security domains.",
  },
  {
    value: "Professional",
    desc: "Working in security or an adjacent role day-to-day.",
  },
];

export default function SkillStep({ form, update, next }) {
  const canContinue = form.skill_level.length > 0;

  return (
    <div className="ob-step">
      <h2>What&apos;s your skill level?</h2>
      <p className="ob-step-sub">
        We&apos;ll use this to calibrate the difficulty of labs and challenges.
      </p>

      <div className="ob-level-grid">
        {LEVELS.map((lvl) => {
          const selected = form.skill_level === lvl.value;
          return (
            <button
              key={lvl.value}
              type="button"
              className={"ob-level-card" + (selected ? " selected" : "")}
              onClick={() => update({ skill_level: lvl.value })}
            >
              {selected && (
                <span className="ob-level-check">
                  <Check size={16} />
                </span>
              )}
              <span className="ob-level-title">{lvl.value}</span>
              <span className="ob-level-desc">{lvl.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="ob-actions">
        <span className="ob-actions-spacer" />
        <button
          className="ob-btn-primary"
          onClick={next}
          disabled={!canContinue}
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
