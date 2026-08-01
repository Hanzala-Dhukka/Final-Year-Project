import { motion } from "framer-motion";
import { FaCheckCircle, FaLightbulb } from "react-icons/fa";
import "./AIRemediation.css";

export default function RecommendationPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      className="recommendation-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <div className="card-title">
        <FaLightbulb size={18} color="#f59e0b" />
        <h3>Recommendations</h3>
      </div>

      <div className="recommendation-list">
        {recommendations.map((rec, index) => {
          const text = typeof rec === "string" ? rec : rec.text || rec.description;
          return (
            <motion.div
              key={index}
              className="recommendation-item"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.06 }}
            >
              <FaCheckCircle size={16} color="#22c55e" className="rec-icon" />
              <span>{text}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}