import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowBack, PersonAdd } from "@mui/icons-material";
import { projectApi } from "../../api/projectApi";
import MemberCard from "../../components/Projects/MemberCard";

export default function TeamMembers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", user_id: "", role: "Developer" });
  const [myRole, setMyRole] = useState("");

  const load = async () => {
    try {
      const { data } = await projectApi.listMembers(id);
      setMembers(data || []);
      const me = (data || []).find((m) => m.user_id);
      // role resolution happens in API; we approximate via first owner presence
      setMyRole("");
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const inviteMember = async () => {
    try {
      await projectApi.invite(id, invite);
      toast.success("Member invited");
      setOpen(false);
      setInvite({ email: "", user_id: "", role: "Developer" });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Invite failed");
    }
  };

  const remove = async (member) => {
    try {
      await projectApi.removeMember(id, member.user_id);
      toast.success("Member removed");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Remove failed");
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
          <Typography variant="h4" fontWeight={800}>
            Team Members
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setOpen(true)}>
          Invite
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {members.map((m) => (
          <Grid item xs={12} sm={6} md={4} key={m.id}>
            <MemberCard member={m} canManage={m.role !== "Owner"} onRemove={remove} />
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
            />
            <TextField
              label="User ID (optional)"
              value={invite.user_id}
              onChange={(e) => setInvite({ ...invite, user_id: e.target.value })}
            />
            <TextField
              select
              label="Role"
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value })}
            >
              {["Owner", "Admin", "Developer", "Viewer"].map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={inviteMember}>
            Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
