import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { keyframes } from "@emotion/react";
import toast from "react-hot-toast";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Tooltip,
  Divider,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  Skeleton,
} from "@mui/material";
import {
  FolderGit2,
  Plus,
  Sun,
  Moon,
  Search,
  Users,
  FileText,
  ShieldAlert,
  RefreshCw,
  LayoutGrid,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { projectApi } from "../../api/projectApi";
import { useTheme } from "../../theme/useTheme";
import ProjectCard from "../../components/Projects/ProjectCard";

const STATUS_FILTERS = ["All", "Active", "On Hold", "Archived"];

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const STATUS_COLOR = {
  Active: "#22C55E",
  "On Hold": "#F59E0B",
  Archived: "#94A3B8",
};

function StatTile({ icon, color, value, label }) {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: "1px solid var(--borderColor)",
        background: "var(--cardBg)",
        boxShadow: "var(--shadowSoft)",
        px: 2,
        py: 1.75,
        display: "flex",
        alignItems: "center",
        gap: 1.75,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${color}1f`,
          color,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "var(--textPrimary)",
            letterSpacing: "-0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "var(--textSecondary)" }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    tech_stack: "",
    repo_url: "",
    status: "Active",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data } = await projectApi.list();
      setProjects(data || []);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to load projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const { data } = await projectApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        tech_stack: form.tech_stack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        repo_url: form.repo_url.trim(),
        status: form.status,
      });
      toast.success("Project created");
      setOpen(false);
      setForm({
        name: "",
        description: "",
        tech_stack: "",
        repo_url: "",
        status: "Active",
      });
      navigate(`/projects/${data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectApi.remove(deleteTarget.id);
      toast.success("Project deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;
      const haystack = [
        p.name,
        p.description,
        (p.tech_stack || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [projects, query, statusFilter]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "Active").length;
    const members = projects.reduce((sum, p) => sum + (p.member_count || 0), 0);
    const reports = projects.reduce((sum, p) => sum + (p.report_count || 0), 0);
    return { total, active, members, reports };
  }, [projects]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%)",
              border: "1px solid rgba(37,99,235,0.25)",
              boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
              color: "#2563EB",
            }}
          >
            <FolderGit2 size={26} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ letterSpacing: "-0.02em", color: "var(--textPrimary)" }}
            >
              Projects
            </Typography>
            <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5 }}>
              Collaborative threat modeling workspaces — scan, report and track risk together.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            <Box
              component="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 42,
                height: 42,
                borderRadius: 2,
                border: "1px solid var(--glassBorder)",
                background: "var(--glassBg)",
                color: "var(--textSecondary)",
                cursor: "pointer",
                "&:hover": {
                  background: "var(--surfaceHover)",
                  color: "var(--textPrimary)",
                },
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Box>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  ...(refreshing
                    ? { animation: `${spin} 1s linear infinite` }
                    : {}),
                }}
              >
                <RefreshCw size={17} />
              </Box>
            }
            onClick={() => load(true)}
            sx={{
              background: "var(--glassBg)",
              color: "var(--textPrimary)",
              border: "1px solid var(--glassBorder)",
              boxShadow: "none",
              "&:hover": { background: "var(--surfaceHover)" },
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setOpen(true)}
            sx={{
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)",
              },
            }}
          >
            New Project
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ borderColor: "var(--borderColor)" }} />

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 2.5 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatTile
              icon={<LayoutGrid size={20} />}
              color="#2563EB"
              value={stats.total}
              label="Total Projects"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatTile
              icon={<ShieldAlert size={20} />}
              color="#22C55E"
              value={stats.active}
              label="Active"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatTile
              icon={<Users size={20} />}
              color="#8B5CF6"
              value={stats.members}
              label="Team Members"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StatTile
              icon={<FileText size={20} />}
              color="#06B6D4"
              value={stats.reports}
              label="Security Reports"
            />
          </Box>
        </Stack>
      )}

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <Box
          sx={{
            mt: 2.5,
            borderRadius: 2,
            border: "1px solid var(--dangerSoft)",
            bgcolor: "var(--dangerSoft)",
            color: "#EF4444",
            px: 2.5,
            py: 1.5,
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ShieldAlert size={18} />
          {error}
          <Button
            size="small"
            sx={{ ml: "auto", color: "#EF4444", fontWeight: 700 }}
            onClick={() => load()}
          >
            Retry
          </Button>
        </Box>
      )}

      {/* ── Toolbar: search + filter ─────────────────────────────────── */}
      {!loading && !error && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ mt: 2.5, mb: 0.5 }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Search by name, description or tech stack…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              maxWidth: { md: 380 },
              "& .MuiOutlinedInput-root": {
                background: "var(--glassBg)",
                color: "var(--textPrimary)",
                "& fieldset": { borderColor: "var(--borderColor)" },
                "&:hover fieldset": { borderColor: "var(--borderStrong)" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={17} style={{ color: "var(--textMuted)" }} />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={0.75}>
            {STATUS_FILTERS.map((s) => {
              const selected = statusFilter === s;
              const color = STATUS_COLOR[s] || "#2563EB";
              return (
                <Chip
                  key={s}
                  label={s}
                  onClick={() => setStatusFilter(s)}
                  sx={{
                    height: 30,
                    fontSize: 12,
                    fontWeight: 700,
                    color: selected ? (s === "All" ? "#fff" : color) : "var(--textSecondary)",
                    ...(selected && s === "All"
                      ? {
                          background:
                            "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                          border: "1px solid transparent",
                        }
                      : {
                          bgcolor: selected
                            ? `${color}22`
                            : "var(--surfaceHover)",
                          border: `1px solid ${
                            selected
                              ? `${color}66`
                              : "var(--borderColor)"
                          }`,
                        }),
                    "&:hover": { bgcolor: selected ? undefined : "var(--borderColor)" },
                  }}
                />
              );
            })}
          </Stack>
          <Typography
            sx={{
              ml: { md: "auto" },
              fontSize: 12.5,
              color: "var(--textMuted)",
              fontWeight: 600,
            }}
          >
            {filtered.length} of {projects.length} project
            {projects.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      )}

      {/* ── Loading skeletons ─────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2.5,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={280}
                sx={{
                  borderRadius: 3,
                  bgcolor: "var(--borderColor)",
                  transform: "none",
                }}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Box
                sx={{
                  mt: 3,
                  borderRadius: 3,
                  border: "1px dashed var(--borderStrong)",
                  background: "var(--cardBg)",
                  px: 3,
                  py: 8,
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    mx: "auto",
                    mb: 2,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(37,99,235,0.10)",
                    color: "#2563EB",
                  }}
                >
                  {projects.length === 0 ? (
                    <FolderGit2 size={32} />
                  ) : (
                    <Search size={32} />
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: "var(--textPrimary)",
                  }}
                >
                  {projects.length === 0
                    ? "No projects yet"
                    : "No projects match your search"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    color: "var(--textSecondary)",
                    mt: 0.75,
                    maxWidth: 420,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {projects.length === 0
                    ? "Create your first collaborative workspace to start threat modeling, scanning repositories and tracking security risk."
                    : "Try adjusting the search or clearing the status filter to see more projects."}
                </Typography>
                {projects.length === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<Plus size={17} />}
                    onClick={() => setOpen(true)}
                    sx={{
                      mt: 2.5,
                      background:
                        "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                      color: "#fff",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)",
                      },
                    }}
                  >
                    Create your first project
                  </Button>
                )}
              </Box>
            </motion.div>
          ) : (
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 2.5,
              }}
            >
              {filtered.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  showDelete
                  onClick={(id) => navigate(`/projects/${id}`)}
                  onDelete={(proj) => setDeleteTarget(proj)}
                />
              ))}
            </Box>
          )}
        </AnimatePresence>
      )}

      {/* ── Create dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={open}
        onClose={() => !creating && setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "var(--cardBg)",
            border: "1px solid var(--borderColor)",
            boxShadow: "var(--shadow)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(37,99,235,0.12)",
                color: "#2563EB",
              }}
            >
              <FolderGit2 size={20} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: "var(--textPrimary)" }}>
                Create Project
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)" }}>
                Set up a collaborative threat modeling workspace
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Project Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!form.name.trim() && form.name.length > 0}
              helperText={
                !form.name.trim() && form.name.length > 0
                  ? "Name is required"
                  : ""
              }
              sx={inputSx}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              placeholder="Brief description of the project and its security goals"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              sx={inputSx}
            />
            <TextField
              label="Repository URL"
              fullWidth
              placeholder="https://github.com/username/repository"
              value={form.repo_url}
              onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
              helperText="GitHub repository URL for automated security scanning"
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <Box
                    component="span"
                    sx={{ mr: 1, display: "inline-flex", color: "var(--textSecondary)" }}
                  >
                    <ArrowUpRight size={18} />
                  </Box>
                ),
              }}
            />
            <TextField
              label="Tech Stack (comma separated)"
              fullWidth
              placeholder="FastAPI, React, MongoDB, Python"
              value={form.tech_stack}
              onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
              helperText="Technologies used in this project"
              sx={inputSx}
            />
            <TextField
              select
              label="Status"
              fullWidth
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              sx={inputSx}
            >
              {["Active", "On Hold", "Archived"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setOpen(false)}
            disabled={creating}
            sx={{ color: "var(--textSecondary)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={create}
            disabled={!form.name.trim() || creating}
            sx={{
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)",
              },
            }}
          >
            {creating ? "Creating…" : "Create Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm dialog ─────────────────────────────────────── */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "var(--cardBg)",
            border: "1px solid var(--borderColor)",
            boxShadow: "var(--shadow)",
          },
        }}
      >
        <DialogContent sx={{ pt: 3, pb: 1, textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: "auto",
              mb: 1.5,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(239,68,68,0.12)",
              color: "#EF4444",
            }}
          >
            <Trash2 size={26} />
          </Box>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 800,
              color: "var(--textPrimary)",
            }}
          >
            Delete project?
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: "var(--textSecondary)",
              mt: 0.75,
              lineHeight: 1.55,
            }}
          >
            <b>{deleteTarget?.name}</b> and all of its reports, members and
            activity logs will be permanently removed. This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center", gap: 1 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{ color: "var(--textSecondary)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleting}
            sx={{
              bgcolor: "#EF4444",
              "&:hover": { bgcolor: "#DC2626" },
            }}
          >
            {deleting ? "Deleting…" : "Delete Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--textPrimary)",
    background: "var(--glassBg)",
    "& fieldset": { borderColor: "var(--borderColor)" },
    "&:hover fieldset": { borderColor: "var(--borderStrong)" },
    "&.Mui-focused fieldset": { borderColor: "#2563EB" },
  },
  "& .MuiInputLabel-root": { color: "var(--textSecondary)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#2563EB" },
  "& .MuiSelect-icon": { color: "var(--textSecondary)" },
  "& .MuiFormHelperText-root": { color: "var(--textMuted)" },
};