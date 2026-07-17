import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { projectApi } from "../../api/projectApi";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", tech_stack: "", status: "Active" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await projectApi.get(id);
        setProject(data);
        setForm({
          name: data.name,
          description: data.description,
          tech_stack: (data.tech_stack || []).join(", "),
          status: data.status,
        });
      } catch (e) {
        setError(e.response?.data?.detail || "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await projectApi.update(id, {
        name: form.name,
        description: form.description,
        tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
        status: form.status,
      });
      toast.success("Project updated");
      navigate(`/projects/${id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${id}`)}>
          Back
        </Button>
        <Typography variant="h4" fontWeight={800}>
          Project Details
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <TextField
              label="Tech Stack (comma separated)"
              value={form.tech_stack}
              onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
            />
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {["Active", "Archived", "On Hold"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={save} disabled={saving}>
                Save Changes
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
