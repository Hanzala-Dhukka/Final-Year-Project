import GppGoodIcon from "@mui/icons-material/GppGood";
import BugReportIcon from "@mui/icons-material/BugReport";
import SecurityIcon from "@mui/icons-material/Security";
import ShieldIcon from "@mui/icons-material/Shield";

// Central metadata for the four mapped compliance frameworks.
export const FRAMEWORK_META = {
  OWASP: {
    color: "#2563EB",
    soft: "rgba(37, 99, 235, 0.12)",
    icon: GppGoodIcon,
    desc: "OWASP Top 10 web risks",
  },
  CWE: {
    color: "#7C3AED",
    soft: "rgba(124, 58, 237, 0.14)",
    icon: BugReportIcon,
    desc: "Common Weakness Enumeration",
  },
  MITRE: {
    color: "#DC2626",
    soft: "rgba(220, 38, 38, 0.12)",
    icon: ShieldIcon,
    desc: "MITRE ATT&CK tactics",
  },
  NIST: {
    color: "#059669",
    soft: "rgba(5, 150, 105, 0.12)",
    icon: SecurityIcon,
    desc: "NIST Cybersecurity Framework",
  },
};

export const FRAMEWORK_ORDER = ["OWASP", "CWE", "MITRE", "NIST"];

// Status classification from a percentage score.
export function scoreStatus(score) {
  if (score >= 80) return { key: "compliant", label: "Compliant", color: "#059669", soft: "rgba(5,150,105,0.14)" };
  if (score >= 60) return { key: "review", label: "Needs Review", color: "#F59E0B", soft: "rgba(245,158,11,0.14)" };
  return { key: "atrisk", label: "At Risk", color: "#EF4444", soft: "rgba(239,68,68,0.14)" };
}

export function frameworkMeta(name) {
  return FRAMEWORK_META[name] || {
    color: "#64748B",
    soft: "rgba(100,116,139,0.14)",
    icon: ShieldIcon,
    desc: name,
  };
}

export default FRAMEWORK_META;