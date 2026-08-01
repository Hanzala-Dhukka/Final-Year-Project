import { motion } from "framer-motion";
import { FaRobot, FaExclamationTriangle, FaShieldAlt, FaLightbulb } from "react-icons/fa";
import "./AIRemediation.css";

export default function AIExplanation({ explanation, finding }) {
  if (!explanation) return null;

  const sections = [
    { label: "What happened?", icon: FaExclamationTriangle, color: "#ef4444", content: explanation.what || explanation },
    { label: "Why is it dangerous?", icon: FaShieldAlt, color: "#f59e0b", content: explanation.whyDangerous },
    { label: "How can it be exploited?", icon: FaExclamationTriangle, color: "#ea580c", content: explanation.exploitation },
    { label: "Why is the AI fix safer?", icon: FaLightbulb, color: "#22c55e", content: explanation.whySafer },
  ];

  const hasDetailedSections = sections.some((s) => s.content);

  return (
    <motion.div
      className="ai-explanation-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="card-title">
        <FaRobot size={18} color="#6366f1" />
        <h3>AI Explanation</h3>
      </div>

      {hasDetailedSections ? (
        <div className="explanation-sections">
          {sections.map((section, index) =>
            section.content ? (
              <motion.div
                key={section.label}
                className="explanation-section"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
              >
                <div className="section-label">
                  <section.icon size={16} style={{ color: section.color }} />
                  <span>{section.label}</span>
                </div>
                <p>{section.content}</p>
              </motion.div>
            ) : null
          )}
        </div>
      ) : (
        <div className="explanation-text">
          <p>{explanation}</p>
        </div>
      )}
    </motion.div>
  );
}