import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Stack,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Assessment,
  People,
  Description,
  Comment,
  Speed,
  History,
} from "@mui/icons-material";
import { projectApi } from "../../api/projectApi";
import { scoreColor } from "../../components/ThreatDashboard/severity";

function StatCard({ icon, label, value, color }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${color}22`,
            color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: p }, { data: r }] = await Promise.all([
          projectApi.get(id),
          projectApi.listReports(id),
        ]);
        setProject(p);
        setReports(r || []);
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const latest = reports[0];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {project.name}
          </Typography>
          <Typography color="text.secondary">{project.description}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip label={project.status} />
          <Button variant="outlined" onClick={() => navigate(`/projects/${id}/details`)}>
            Details
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/projects/${id}/members`)}>
            Team
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/projects/${id}/versions`)}>
            Versions
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/projects/${id}/timeline`)}>
            Activity
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6} md={2}>
          <StatCard icon={<Description />} label="Total Reports" value={reports.length} color="#6366f1" />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard
            icon={<Speed />}
            label="Current Risk"
            value={project.latest_risk_score ?? "—"}
            color={project.latest_risk_score != null ? scoreColor(project.latest_risk_score) : "#64748b"}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard icon={<Assessment />} label="Critical Issues" value={latest?.risk_level || "—"} color="#e11d48" />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard icon={<History />} label="Last Scan" value={latest?.created_at ? new Date(latest.created_at).toLocaleDateString() : "—"} color="#0ea5e9" />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard icon={<People />} label="Members" value={project.member_count} color="#22c55e" />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard icon={<Comment />} label="Pending" value={0} color="#eab308" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tech Stack
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {(project.tech_stack || []).map((t) => (
                  <Chip key={t} label={t} />
                ))}
                {(project.tech_stack || []).length === 0 && (
                  <Typography color="text.secondary">Not specified</Typography>
                )}
              </Stack>
              <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                Recent Reports
              </Typography>
              {reports.length === 0 ? (
                <Typography color="text.secondary">
                  No threat reports generated yet.
                </Typography>
              ) : (
                reports.map((r) => (
                  <Card key={r.id} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={600}>Version {r.version}</Typography>
                        <Chip
                          label={r.risk_level}
                          size="small"
                          sx={{ color: scoreColor(r.risk_score), fontWeight: 700 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1.5}>
                <Button variant="contained" onClick={() => navigate(`/threat-analysis`)}>
                  Run Threat Analysis
                </Button>
                <Button variant="outlined" onClick={() => navigate(`/projects/${id}/versions`)}>
                  Compare Versions
                </Button>
                <Button variant="outlined" onClick={() => navigate(`/projects/${id}/timeline`)}>
                  View Activity
                </Button>
                <Button variant="outlined" onClick={() => navigate(`/projects/${id}/members`)}>
                  Manage Team
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
