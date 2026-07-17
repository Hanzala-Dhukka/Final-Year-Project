import ThreatDashboard from "../ThreatDashboard/ThreatDashboard";

// Report viewer (Module 4.4 flow: Threat Reports → Open Report → Dashboard).
// Reuses the interactive Threat Dashboard for the given report id.
export default function ReportViewer({ id }) {
  // Pass the id through by rendering the ThreatDashboard page component,
  // which reads the :id param from the route.
  return <ThreatDashboard id={id} />;
}
