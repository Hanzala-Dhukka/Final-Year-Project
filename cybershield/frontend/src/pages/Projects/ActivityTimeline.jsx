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
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { projectApi } from "../../api/projectApi";
import Timeline from "../../components/Projects/Timeline";
import AuditLogTable from "../../components/Projects/AuditLogTable";

export default function ActivityTimeline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [activities, setActivities] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [a, au] = await Promise.all([
          projectApi.timeline(id),
          projectApi.audit(id),
        ]);
        setActivities(a.data || []);
        setAudit(au.data || []);
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load activity");
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${id}`)}>
          Back
        </Button>
        <Typography variant="h4" fontWeight={800}>
          Activity Timeline
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Timeline" />
        <Tab label="Audit Logs" />
      </Tabs>

      <Grid container spacing={3}>
        <Grid item xs={12} md={tab === 0 ? 6 : 12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {tab === 0 ? "Project Activity" : "Audit Log"}
              </Typography>
              {tab === 0 ? (
                <Timeline activities={activities} />
              ) : (
                <AuditLogTable logs={audit} />
              )}
            </CardContent>
          </Card>
        </Grid>
        {tab === 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Audit Events
                </Typography>
                <AuditLogTable logs={audit.slice(0, 8)} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
