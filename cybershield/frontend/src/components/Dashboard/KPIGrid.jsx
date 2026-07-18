import { Grid, Card, CardContent, Typography, Box, LinearProgress } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import WarningIcon from "@mui/icons-material/Warning";
import PolicyIcon from "@mui/icons-material/Policy";
import BugReportIcon from "@mui/icons-material/BugReport";
import FolderIcon from "@mui/icons-material/Folder";
import TimelineIcon from "@mui/icons-material/Timeline";

function riskColor(risk) {
  return { Critical: "#DC2626", High: "#F97316", Medium: "#F59E0B", Low: "#059669" }[risk] || "#64748B";
}

function KpiCard({ label, value, sub, icon, color, progress }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color, mb: 1 }}>
          {icon}
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={800}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
        {progress != null && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1, height: 6, borderRadius: 3, backgroundColor: "#E5E7EB",
              "& .MuiLinearProgress-bar": { backgroundColor: color, borderRadius: 3 } }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Top KPI card row for the executive dashboard.
export default function KPIGrid({ kpis = {} }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Security Score"
          value={`${kpis.security_score ?? 0}%`}
          icon={<ShieldIcon />}
          color="#2563EB"
          progress={kpis.security_score}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Risk Level"
          value={kpis.risk_level ?? "Unknown"}
          sub={kpis.open_vulnerabilities != null ? `${kpis.open_vulnerabilities} open vulns` : ""}
          icon={<WarningIcon />}
          color={riskColor(kpis.risk_level)}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Compliance"
          value={`${kpis.compliance ?? 0}%`}
          icon={<PolicyIcon />}
          color="#059669"
          progress={kpis.compliance}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Critical Issues"
          value={kpis.critical ?? 0}
          sub={kpis.high != null ? `${kpis.high} high` : ""}
          icon={<BugReportIcon />}
          color="#DC2626"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Checklist Progress"
          value={`${kpis.checklist_progress ?? 0}%`}
          icon={<TimelineIcon />}
          color="#7C3AED"
          progress={kpis.checklist_progress}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Open Vulnerabilities"
          value={kpis.open_vulnerabilities ?? 0}
          icon={<BugReportIcon />}
          color="#DC2626"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Projects"
          value={kpis.projects ?? 0}
          icon={<FolderIcon />}
          color="#0891B2"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Last Scan"
          value={kpis.last_scan || "—"}
          icon={<TimelineIcon />}
          color="#64748B"
        />
      </Grid>
    </Grid>
  );
}
