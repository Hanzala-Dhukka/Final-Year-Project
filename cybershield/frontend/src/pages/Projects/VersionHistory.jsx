import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { ArrowBack, Share } from "@mui/icons-material";
import { projectApi } from "../../api/projectApi";
import { scoreColor } from "../../components/ThreatDashboard/severity";
import VersionCompare from "../../components/Projects/VersionCompare";
import CommentBox from "../../components/Projects/CommentBox";
import ShareDialog from "../../components/Projects/ShareDialog";

export default function VersionHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [share, setShare] = useState({ token: "", url: "", expiresAt: "" });

  const load = async () => {
    try {
      const { data } = await projectApi.listReports(id);
      setReports(data || []);
      if (data?.length) {
        selectVersion(data[0]);
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectVersion = async (report) => {
    setSelected(report);
    try {
      const { data } = await projectApi.listComments(report.id);
      setComments(data || []);
    } catch {
      setComments([]);
    }
  };

  const compare = async (a, b) => {
    try {
      const { data } = await projectApi.compareVersions(id, a, b);
      return data;
    } catch (e) {
      toast.error("Compare failed");
      return null;
    }
  };

  const addComment = async (content) => {
    if (!selected) return;
    try {
      await projectApi.addComment(selected.id, content);
      const { data } = await projectApi.listComments(selected.id);
      setComments(data || []);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Comment failed");
    }
  };

  const deleteComment = async (comment) => {
    try {
      await projectApi.deleteComment(comment.id);
      const { data } = await projectApi.listComments(selected.id);
      setComments(data || []);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const generateShare = async (days, password) => {
    if (!selected) return;
    try {
      const { data } = await projectApi.share(id, selected.id, { expires_in_days: days, password });
      setShare({ token: data.token, url: data.url, expiresAt: data.expires_at });
      toast.success("Share link generated");
    } catch (e) {
      toast.error("Share failed");
    }
  };

  const revoke = async (token) => {
    try {
      await projectApi.revokeShare(token);
      setShare({ token: "", url: "", expiresAt: "" });
      toast.success("Link revoked");
    } catch {
      toast.error("Revoke failed");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
          <Typography variant="h4" fontWeight={800}>
            Version History
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Share />}
          onClick={() => setShareOpen(true)}
          disabled={!selected}
        >
          Share Report
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Versions
              </Typography>
              {reports.length === 0 ? (
                <Typography color="text.secondary">No reports yet.</Typography>
              ) : (
                reports.map((r) => (
                  <Card
                    key={r.id}
                    variant={selected?.id === r.id ? "elevation" : "outlined"}
                    sx={{
                      mb: 1,
                      cursor: "pointer",
                      borderLeft: `4px solid ${scoreColor(r.risk_score)}`,
                    }}
                    onClick={() => selectVersion(r)}
                  >
                    <CardContent sx={{ py: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={600}>v{r.version}</Typography>
                        <Chip
                          label={r.risk_level}
                          size="small"
                          sx={{ color: scoreColor(r.risk_score), fontWeight: 700 }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compare Versions
              </Typography>
              <VersionCompare versions={reports} onCompare={compare} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comments {selected ? `· v${selected.version}` : ""}
              </Typography>
              <CommentBox
                comments={comments}
                canComment
                onAdd={addComment}
                onDelete={deleteComment}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onGenerate={generateShare}
        onRevoke={revoke}
        token={share.token}
        url={share.url}
        expiresAt={share.expiresAt}
      />
    </Container>
  );
}
