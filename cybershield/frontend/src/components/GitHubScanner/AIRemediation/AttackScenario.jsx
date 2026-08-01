import { motion } from "framer-motion";
import { FaCrosshairs, FaArrowRight, FaUserSecret, FaServer, FaDatabase, FaSkullCrossbones } from "react-icons/fa";
import "./AIRemediation.css";

export default function AttackScenario({ scenario, finding }) {
  if (!scenario) return null;

  const steps = [
    { icon: FaUserSecret, label: "Attacker Input", value: scenario.input || scenario.attackInput, color: "#ef4444" },
    { icon: FaServer, label: "Application", value: scenario.application || scenario.executedQuery, color: "#f59e0b" },
    { icon: FaDatabase, label: "Database Impact", value: scenario.database || scenario.impact, color: "#3b82f6" },
    { icon: FaSkullCrossbones, label: "Result", value: scenario.result || scenario.consequence, color: "#dc2626" },
  ];

  const hasSteps = steps.some((s) => s.value);

  return (
    <motion.div
      className="attack-scenario-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="card-title">
        <FaCrosshairs size={18} color="#ef4444" />
        <h3>Attack Scenario</h3>
      </div>

      {hasSteps ? (
        <div className="attack-flow">
          {steps.map((step, index) =>
            step.value ? (
              <motion.div
                key={step.label}
                className="attack-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + index * 0.1 }}
              >
                <div className="attack-step-icon" style={{ backgroundColor: `${step.color}20`, color: step.color }}>
                  <step.icon size={20} />
                </div>
                <div className="attack-step-content">
                  <span className="attack-step-label">{step.label}</span>
                  <span className="attack-step-value">{step.value}</span>
                </div>
                {index < steps.length - 1 && (
                  <FaArrowRight size={16} className="attack-arrow" color="#475569" />
                )}
              </motion.div>
            ) : null
          )}
        </div>
      ) : (
        <p className="attack-text">{typeof scenario === "string" ? scenario : scenario.description}</p>
      )}
    </motion.div>
  );
}