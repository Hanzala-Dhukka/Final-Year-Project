import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import GppGoodIcon from "@mui/icons-material/GppGood";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { complianceApi, downloadBlob } from "../../api/complianceApi";
import ComplianceProgress from "../../components/Compliance/ComplianceProgress";
import FrameworkCard from "../../components/Compliance/FrameworkCard";
import ComplianceChart from "../../components/Compliance/ComplianceChart";
import GapAnalysis from "../../components/Compliance/GapAnalysis";
import ComplianceSummary from "../../components/Compliance/ComplianceSummary";
import SourceBreakdown from "../../components/Compliance/SourceBreakdown";
import { FRAMEWORK_ORDER } from "../../components/Compliance/frameworkMeta";

function Section({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ComplianceDashboard() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await complianceApi.listProjects();
        const list = res.data || [];
        setProjects(list);
        if (list.length && !projectId) setProjectId(list[0].id);
      } catch {
        setError("Unable to load projects.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReport = async (id) => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    setToast("");
    try {
      const res = await complianceApi.get(id);
      setData(res.data);
    } catch {
      setError("Unable to load compliance report.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadReport(projectId);
  }, [projectId]);

  const onGenerate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError("");
    setToast("");
    try {
      const res = await complianceApi.generate(projectId);
      setData(res.data.report);
      setToast("Compliance report generated successfully.");
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          "Failed to generate compliance report. Run a GitHub scan or threat report first."
      );
    } finally {
      setGenerating(false);
    }
  };

  const onExportPdf = async () => {
    try {
      const res = await complianceApi.exportPdf(projectId);
      downloadBlob(res, "compliance_report.pdf");
    } catch {
      setError("Failed to export PDF.");
    }
  };

  const onExportJson = async () => {
    try {
      const res = await complianceApi.exportJson(projectId);
      downloadBlob(res, "compliance_report.json");
    } catch {
      setError("Failed to export JSON.");
    }
  };

  const frameworks = data?.frameworks || {};
  const breakdown = data?.breakdown || {};
  const frameworkEntries = FRAMEWORK_ORDER.filter((k) => k in frameworks);
  const rec = data?.recommendations || {};
  const projectName = data?.project_name;
  const hasReport = data && frameworkEntries.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Section>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                color: "#fff",
                boxShadow: "0 6px 20px rgba(37,99,235,0.4)",
              }}
            >
              <GppGoodIcon />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Compliance Dashboard
              </Typography>
              <Typography color="text.secondary">
                How compliant is your project with major cybersecurity standards?
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.2}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              select
              size="small"
              label="Project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              sx={{ minWidth: 210 }}
            >
              {projects.length === 0 && (
                <MenuItem value="" disabled>
                  No projects
                </MenuItem>
              )}
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={onGenerate}
              disabled={generating || !projectId}
              sx={{
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              }}
            >
              {generating ? "Generating..." : "Generate Report"}
            </Button>
            {hasReport && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => loadReport(projectId)}
                disabled={loading}
              >
                Refresh
              </Button>
            )}
          </Stack>
        </Stack>
      </Section>

      {(error || toast) && (
        <Alert
          severity={toast ? "success" : "info"}
          sx={{ mb: 2 }}
          onClose={() => (toast ? setToast("") : setError(""))}
        >
          {toast || error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Loading compliance report...</Typography>
          </Stack>
        </Box>
      )}

      {!loading && !hasReport && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box
            sx={{
              textAlign: "center",
              py: 9,
              px: 4,
              borderRadius: 3,
              border: "1px dashed rgba(148,163,184,0.35)",
              bgcolor: "rgba(37,99,235,0.04)",
            }}
          >
            <GppGoodIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              No Compliance Report Yet
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 560, mx: "auto", mb: 3 }}>
              Select a project and click <b>Generate Report</b> to map your GitHub scan,
              SAST findings, threat report, security checklist and OWASP results onto{" "}
              <b>OWASP</b>, <b>CWE</b>, <b>MITRE ATT&amp;CK</b> and <b>NIST CSF</b>.
            </Typography>
            {projects.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                You don't have any projects yet.
              </Typography>
            )}
          </Box>
        </motion.div>
      )}

      {!loading && hasReport && (
        <>
          <Section delay={0.05}>
            <ComplianceProgress score={data.overall_score || 0} estimate={rec.estimated_score_after_fixes} />
            {projectName && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Report for <b>{projectName}</b>
                {data.created_at ? ` · Generated ${new Date(data.created_at).toLocaleString()}` : ""}
              </Typography>
            )}
          </Section>

          {/* Framework cards */}
          <Section delay={0.1}>
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
                gap: 3,
              }}
            >
              {frameworkEntries.map((name) => {
                const bd = breakdown[name.toLowerCase()] || {};
                return (
                  <FrameworkCard
                    key={name}
                    name={name}
                    score={frameworks[name]}
                    satisfied={bd.satisfied}
                    total={bd.total}
                  />
                );
              })}
            </Box>
          </Section>

          {/* Charts */}
          <Section delay={0.15}>
            <Box sx={{ mt: 3 }}>
              <ComplianceChart frameworks={frameworks} history={data.history || []} />
            </Box>
          </Section>

          {/* Summary + Gap + Sources */}
          <Section delay={0.2}>
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1.4fr 1fr" },
                gap: 3,
              }}
            >
              <ComplianceSummary summary={data.summary} />
              <GapAnalysis gap={data.gap_analysis || []} breakdown={breakdown} />
              <SourceBreakdown sources={data.sources || {}} />
            </Box>
          </Section>

          {/* AI Recommendations */}
          <Section delay={0.25}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(245,158,11,0.14)",
                      color: "warning.main",
                    }}
                  >
                    <TrendingUpIcon fontSize="small" />
                  </Box>
                  <Typography variant="h6" fontWeight={800}>
                    AI Compliance Recommendation
                  </Typography>
                  {rec.estimated_score_after_fixes != null && (
                    <Chip label={`Est. after fixes: ${rec.estimated_score_after_fixes}%`} color="success" size="small" />
                  )}
                </Stack>

                {rec.executive_summary && (
                  <Typography variant="body1" gutterBottom>
                    {rec.executive_summary}
                  </Typography>
                )}

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1.5}>
                  {rec.compliance_weaknesses && (
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <WarningAmberIcon sx={{ fontSize: 18, color: "error.main", mt: 0.3 }} />
                      <Typography variant="body2" color="text.secondary">
                        <b>Weaknesses:</b> {rec.compliance_weaknesses}
                      </Typography>
                    </Stack>
                  )}
                  {rec.business_impact && (
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <BusinessIcon sx={{ fontSize: 17, color: "info.main", mt: 0.3 }} />
                      <Typography variant="body2" color="text.secondary">
                        <b>Business impact:</b> {rec.business_impact}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Priority Improvements
                </Typography>
                <List dense>
                  {(rec.priority_actions || []).map((a, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={a} />
                    </ListItem>
                  ))}
                  {(rec.priority_actions || []).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No actions recommended.
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Section>

          {/* Export */}
          <Section delay={0.3}>
            <Stack direction="row" spacing={1.2} sx={{ mt: 3 }}>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onExportPdf}>
                Export PDF
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onExportJson}>
                Export JSON
              </Button>
            </Stack>
          </Section>
        </>
      )}
    </Container>
  );
}