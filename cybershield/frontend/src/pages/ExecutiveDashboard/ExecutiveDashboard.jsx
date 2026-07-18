import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box, Container, Grid, Typography, Stack, Button, CircularProgress,
  Alert, FormControl, InputLabel, Select, MenuItem, Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { analyticsApi, downloadBlob } from "../../api/analyticsApi";
import KPIGrid from "../../components/Dashboard/KPIGrid";
import TrendChart from "../../components/Dashboard/TrendChart";
import RiskChart from "../../components/Dashboard/RiskChart";
import ComplianceChart from "../../components/Dashboard/ComplianceChart";
import VulnerabilityChart from "../../components/Dashboard/VulnerabilityChart";
import ExecutiveSummary from "../../components/Dashboard/ExecutiveSummary";
import ProjectComparison from "../../components/Dashboard/ProjectComparison";

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

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("security_score");

  const load = async (sb) => {
    setLoading(true);
    setError("");
    try {
      const res = await analyticsApi.getSummary(sb);
      setData(res.data);
    } catch (e) {
      setError("Unable to load the executive dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const onExportPdf = async () => {
    try {
      const res = await analyticsApi.exportPdf();
      downloadBlob(res, "Executive_Security_Report.pdf");
    } catch (e) {
      setError("Failed to export PDF.");
    }
  };

  const onExportJson = async () => {
    try {
      const res = await analyticsApi.exportJson();
      downloadBlob(res, "Executive_Security_Report.json");
    } catch (e) {
      setError("Failed to export JSON.");
    }
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DashboardIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Executive Security Dashboard
            </Typography>
            <Typography color="text.secondary">
              A single CISO view across scans, threats, compliance and learning.
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="sort-by-label">Sort projects by</InputLabel>
            <Select
              labelId="sort-by-label"
              label="Sort projects by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="security_score">Security Score</MenuItem>
              <MenuItem value="risk_level">Risk Level</MenuItem>
              <MenuItem value="compliance_score">Compliance</MenuItem>
              <MenuItem value="open_vulnerabilities">Vulnerabilities</MenuItem>
              <MenuItem value="last_scan">Last Scan</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={() => load(sortBy)}
            disabled={loading}
          >
            Refresh
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

      {!loading && data && (
        <>
          <Section>
            <KPIGrid kpis={data.kpis || {}} />
          </Section>

          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={8}>
              <Section delay={0.05}>
                <TrendChart trends={data.trends || []} />
              </Section>
            </Grid>
            <Grid item xs={12} md={4}>
              <Section delay={0.1}>
                <RiskChart trends={data.trends || []} />
              </Section>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <Section delay={0.15}>
                <ComplianceChart trends={data.trends || []} />
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section delay={0.2}>
                <VulnerabilityChart vulns={data.trends || []} />
              </Section>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} lg={7}>
              <Section delay={0.25}>
                <ProjectComparison rows={data.comparison || []} />
              </Section>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Section delay={0.3}>
                <ExecutiveSummary summary={data.ai_summary || {}} />
              </Section>
            </Grid>
          </Grid>

          <Section delay={0.35}>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={onExportPdf}>
                Export Executive PDF
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onExportJson}>
                Export Executive JSON
              </Button>
            </Stack>
          </Section>
        </>
      )}
    </Container>
  );
}
