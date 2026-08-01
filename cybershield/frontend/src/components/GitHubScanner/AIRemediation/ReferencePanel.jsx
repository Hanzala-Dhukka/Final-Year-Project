import { motion } from "framer-motion";
import { FaExternalLinkAlt, FaShieldAlt } from "react-icons/fa";
import "./AIRemediation.css";

const OWASP_URL = "https://owasp.org/Top10/";
const CWE_URL = "https://cwe.mitre.org/data/definitions/";
const MITRE_URL = "https://attack.mitre.org/";
const CAPEC_URL = "https://capec.mitre.org/data/definitions/";
const CVSS_URL = "https://www.first.org/cvss/calculator/3.1";

export default function ReferencePanel({ finding }) {
  if (!finding) return null;

  const refs = [
    {
      label: "OWASP",
      value: finding.owasp,
      url: finding.owasp ? `${OWASP_URL}${finding.owasp.replace("A0", "A0")}` : null,
      color: "#6366f1",
    },
    {
      label: "CWE",
      value: finding.cwe?.replace("CWE-", ""),
      url: finding.cwe ? `${CWE_URL}${finding.cwe.replace("CWE-", "")}` : null,
      color: "#8b5cf6",
    },
    {
      label: "MITRE",
      value: "Attack",
      url: MITRE_URL,
      color: "#ef4444",
    },
    {
      label: "CAPEC",
      value: finding.capec || "—",
      url: finding.capec ? `${CAPEC_URL}${finding.capec}` : CAPEC_URL,
      color: "#f59e0b",
    },
    {
      label: "CVSS",
      value: finding.cvss?.toFixed(1) || "—",
      url: CVSS_URL,
      color: "#dc2626",
    },
  ];

  return (
    <motion.div
      className="reference-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="card-title">
        <FaShieldAlt size={18} color="#6366f1" />
        <h3>References</h3>
      </div>

      <div className="reference-badges">
        {refs.map((ref, index) =>
          ref.value && ref.value !== "—" ? (
            <motion.a
              key={ref.label}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="reference-badge"
              style={{ borderColor: `${ref.color}40` }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.35 + index * 0.06 }}
              whileHover={{ y: -2, borderColor: ref.color }}
            >
              <span className="ref-label" style={{ color: ref.color }}>{ref.label}</span>
              <span className="ref-value">{ref.value}</span>
              <FaExternalLinkAlt size={10} className="ref-link-icon" />
            </motion.a>
          ) : null
        )}
      </div>
    </motion.div>
  );
}