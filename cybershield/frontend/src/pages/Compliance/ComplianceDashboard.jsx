import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { complianceApi, downloadBlob } from "../../api/complianceApi";
import ComplianceProgress from "../../components/Compliance/ComplianceProgress";
import FrameworkCard from "../../components/Compliance/FrameworkCard";
import ComplianceChart from "../../components/Compliance/ComplianceChart";
import GapAnalysis from "../../components/Compliance/GapAnalysis";
import ComplianceSummary from "../../components/Compliance/ComplianceSummary";

function Section({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
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

  // Load the project picker.
  useEffect(() => {
    (async () => {
      try {
        const res = await complianceApi.listProjects();
        const list = res.data || [];
        setProjects(list);
        if (list.length && !projectId) {
          setProjectId(list[0].id);
        }
      } catch (e) {
        setError("Unable to load projects.");
      }
    })();
  }, []);

  const loadReport = async (id) => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await complianceApi.get(id);
      setData(res.data);
    } catch (e) {
      setError("Unable to load compliance report.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadReport(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onGenerate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError("");
    try {
      const res = await complianceApi.generate(projectId);
      setData(res.data.report);
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
    } catch (e) {
      setError("Failed to export PDF.");
    }
  };

  const onExportJson = async () => {
    try {
      const res = await complianceApi.exportJson(projectId);
      downloadBlob(res, "compliance_report.json");
    } catch (e) {
      setError("Failed to export JSON.");
    }
  };

  const frameworks = data?.frameworks || {};
  const frameworkEntries = Object.entries(frameworks);
  const rec = data?.recommendations || {};
  const hasReport = data && frameworkEntries.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header + controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Compliance Dashboard
          </Typography>
          <Typography color="text.secondary">
            How compliant is your project with major cybersecurity standards?
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField
            select
            size="small"
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            sx={{ minWidth: 220 }}
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
            startIcon={generating ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={onGenerate}
            disabled={generating || !projectId}
          >
            Generate
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !hasReport && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">
              No compliance report yet. Select a project and click <b>Generate</b> to
              map your GitHub scan, threat report, checklist and OWASP results onto
              OWASP, CWE, MITRE ATT&amp;CK and NIST CSF.
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && hasReport && (
        <>
          {/* Overall progress */}
          <Section>
            <ComplianceProgress score={data.overall_score || 0} />
          </Section>

          {/* Framework cards */}
          <Section delay={0.05}>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              {frameworkEntries.map(([name, score]) => (
                <Grid item xs={12} sm={6} md={3} key={name}>
                  <FrameworkCard name={name} score={score} />
                </Grid>
              ))}
            </Grid>
          </Section>

          {/* Charts */}
          <Section delay={0.1}>
            <ComplianceChart frameworks={frameworks} history={data.history} />
          </Section>

          {/* Summary + Gap analysis */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.15}>
                <ComplianceSummary summary={data.summary} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.2}>
                <GapAnalysis gap={data.gap_analysis || []} />
              </Section>
            </Grid>
          </Grid>

          {/* AI Recommendations */}
          <Section delay={0.25}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <LightbulbIcon color="warning" />
                  <Typography variant="h6" fontWeight={800}>
                    AI Compliance Recommendation
                  </Typography>
                  {rec.estimated_score_after_fixes != null && (
                    <Chip
                      label={`Est. after fixes: ${rec.estimated_score_after_fixes}%`}
                      color="success"
                      size="small"
                    />
                  )}
                </Stack>
                {rec.executive_summary && (
                  <Typography variant="body1" gutterBottom>
                    {rec.executive_summary}
                  </Typography>
                )}
                {rec.compliance_weaknesses && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <b>Weaknesses:</b> {rec.compliance_weaknesses}
                  </Typography>
                )}
                {rec.business_impact && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <b>Business impact:</b> {rec.business_impact}
                  </Typography>
                )}
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
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={onExportPdf}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={onExportJson}
              >
                Export JSON
              </Button>
            </Stack>
          </Section>
        </>
      )}
    </Container>
  );
}
