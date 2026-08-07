import { useParams } from "react-router-dom";
import ThreatDashboard from "../ThreatDashboard/ThreatDashboard";

// Report viewer — reads :id from the route and renders the Threat Dashboard.
export default function ReportViewer() {
  const { id } = useParams();
  return <ThreatDashboard />;
}
