import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
  Stack,
  Chip,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { projectApi } from "../../api/projectApi";
import ProjectCard from "../../components/Projects/ProjectCard";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", tech_stack: "", status: "Active" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await projectApi.list();
      setProjects(data || []);
    } catch (e) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    try {
      const { data } = await projectApi.create({
        name: form.name,
        description: form.description,
        tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
        status: form.status,
      });
      toast.success("Project created");
      setOpen(false);
      setForm({ name: "", description: "", tech_stack: "", status: "Active" });
      navigate(`/projects/${data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create project");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Projects
          </Typography>
          <Typography color="text.secondary">
            Collaborative threat modeling workspaces
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          New Project
        </Button>
      </Stack>

      {loading ? (
        <Grid container spacing={3}>
          {[0, 1, 2].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Box sx={{ height: 120 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              No projects yet. Create your first workspace to start collaborating.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <ProjectCard project={p} onClick={(id) => navigate(`/projects/${id}`)} />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Project Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <TextField
              label="Tech Stack (comma separated)"
              placeholder="FastAPI, React, MongoDB"
              value={form.tech_stack}
              onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={create}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
