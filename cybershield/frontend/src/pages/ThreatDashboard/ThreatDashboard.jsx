import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  CircularProgress,
  Stack,
  Skeleton,
  Alert,
} from "@mui/material";
import {
  getDashboard,
  getDashboardReports,
  getRiskHistory,
} from "../../api/threatDashboardApi";
import RiskGauge from "../../components/ThreatDashboard/RiskGauge";
import STRIDERadar from "../../components/ThreatDashboard/STRIDERadar";
import RiskPieChart from "../../components/ThreatDashboard/RiskPieChart";
import RiskTrendChart from "../../components/ThreatDashboard/RiskTrendChart";
import AttackSurfaceDiagram from "../../components/ThreatDashboard/AttackSurfaceDiagram";
import OWASPChart from "../../components/ThreatDashboard/OWASPChart";
import MITRETimeline from "../../components/ThreatDashboard/MITRETimeline";
import RecommendationPanel from "../../components/ThreatDashboard/RecommendationPanel";
import ExecutiveSummaryCard from "../../components/ThreatDashboard/ExecutiveSummaryCard";
import ThreatComparison from "../../components/ThreatDashboard/ThreatComparison";

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

function LoadingSkeleton() {
  return (
    <Grid container spacing={3}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Grid item xs={12} md={6} key={i}>
          <Skeleton variant="rounded" height={260} />
        </Grid>
      ))}
    </Grid>
  );
}

export default function ThreatDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reportId, setReportId] = useState(id || "");
  const [reports, setReports] = useState([]);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load picker list + history once.
  useEffect(() => {
    (async () => {
      try {
        const [r, h] = await Promise.all([getDashboardReports(), getRiskHistory()]);
        setReports(r.data || []);
        setHistory(h.data || []);
        if (!reportId && (r.data || []).length) {
          setReportId(r.data[0].report_id);
        }
      } catch (e) {
        // ignore — dashboard can still render a sample
      }
    })();
  }, []);

  // Load dashboard for the selected report.
  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    getDashboard(reportId)
      .then((res) => setData(res.data))
      .catch(() => setError("Unable to load dashboard for this report."))
      .finally(() => setLoading(false));
  }, [reportId]);

  const onPick = (value) => {
    setReportId(value);
    if (value) navigate(`/threat-dashboard/${value}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Threat Dashboard
          </Typography>
          <Typography color="text.secondary">
            Interactive analytics for your AI threat report
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Report"
          value={reportId}
          onChange={(e) => onPick(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          {reports.length === 0 && (
            <MenuItem value="" disabled>
              No reports yet
            </MenuItem>
          )}
          {reports.map((r) => (
            <MenuItem key={r.report_id} value={r.report_id}>
              {r.project}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {error} Showing a representative sample dashboard.
        </Alert>
      )}

      {!loading && data && (
        <>
          {/* Row 1: Risk Score + Executive Summary */}
          <Grid container spacing={3} sx={{ mb: 0.5 }}>
            <Grid item xs={12} md={4}>
              <Section>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Security Score
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <RiskGauge score={data.risk_score} level={data.risk_level} />
                    </Box>
                  </CardContent>
                </Card>
              </Section>
            </Grid>
            <Grid item xs={12} md={8}>
              <Section delay={0.05}>
                <ExecutiveSummaryCard
                  executive={data.executive}
                  project={data.project}
                  score={data.risk_score}
                />
              </Section>
            </Grid>
          </Grid>

          {/* Row 2: STRIDE + Risk Distribution */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.1}>
                <STRIDERadar stride={data.stride} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.15}>
                <RiskPieChart distribution={data.distribution} />
              </Section>
            </Grid>
          </Grid>

          {/* Row 3: Attack Surface */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Section delay={0.2}>
                <AttackSurfaceDiagram nodes={data.attack_surface} />
              </Section>
            </Grid>
          </Grid>

          {/* Row 4: OWASP + MITRE */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.25}>
                <OWASPChart owasp={data.owasp} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.3}>
                <MITRETimeline mitre={data.mitre} />
              </Section>
            </Grid>
          </Grid>

          {/* Row 5: Recommendations */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.35}>
                <RecommendationPanel recommendations={data.recommendations} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.4}>
                <RiskTrendChart timeline={[...history].reverse()} />
              </Section>
            </Grid>
          </Grid>

          {/* Row 6: Comparison */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Section delay={0.45}>
                <ThreatComparison reports={reports} />
              </Section>
            </Grid>
          </Grid>
        </>
      )}

      {!loading && !data && !error && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
}
