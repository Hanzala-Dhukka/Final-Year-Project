import { useState, useEffect } from "react";
import {
  Box, Typography, Button, CircularProgress, Grid, Card, CardContent, TextField,
  MenuItem, Stack, Divider, FormControlLabel, Switch, Chip, Snackbar, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrow from "@mui/icons-material/PlayArrow";

import ScheduleCard from "../../components/Automation/ScheduleCard";
import AutomationRule from "../../components/Automation/AutomationRule";
import automationApi from "../../api/automationApi";
import { projectApi } from "../../api/projectApi";

const CONDITIONS = [
  { value: "critical_count", label: "Critical Vulnerabilities" },
  { value: "risk_score", label: "Risk Score" },
  { value: "compliance", label: "Compliance Score" },
];
const ACTIONS = ["email", "notification", "ai_checklist", "full_scan", "executive_report"];

export default function Automation() {
  const [projects, setProjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // New schedule form
  const [projId, setProjId] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [freq, setFreq] = useState("daily");

  // New rule form
  const [ruleName, setRuleName] = useState("");
  const [condType, setCondType] = useState("critical_count");
  const [op, setOp] = useState("gt");
  const [threshold, setThreshold] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, r] = await Promise.all([
        projectApi.list(),
        automationApi.listSchedules(),
        automationApi.listRules(),
      ]);
      setProjects(Array.isArray(p) ? p : p?.projects || []);
      setSchedules(s || []);
      setRules(r || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "";

  // Schedule handlers
  const handleCreateSchedule = async () => {
    if (!projId) return setToast({ msg: "Select a project", sev: "warning" });
    try {
      await automationApi.createSchedule({ project_id: projId, repo_url: repoUrl || undefined, frequency: freq });
      setToast({ msg: "Schedule created", sev: "success" });
      setProjId(""); setRepoUrl(""); setFreq("daily");
      load();
    } catch (e) {
      setToast({ msg: "Failed to create schedule", sev: "error" });
    }
  };
  const handleToggleSchedule = async (id, enabled) => {
    await automationApi.updateSchedule(id, { enabled });
    load();
  };
  const handleDeleteSchedule = async (id) => {
    await automationApi.deleteSchedule(id);
    load();
  };
  const handleUpdateSchedule = async (id, payload) => {
    await automationApi.updateSchedule(id, payload);
    load();
  };
  const handleRun = async (sch) => {
    if (!sch.repo_url) return setToast({ msg: "No repository linked to this schedule", sev: "warning" });
    setToast({ msg: "Scan started…", sev: "info" });
    try {
      await automationApi.runScanNow(sch.project_id, sch.repo_url);
      setToast({ msg: "Manual scan completed", sev: "success" });
    } catch (e) {
      setToast({ msg: "Scan failed", sev: "error" });
    }
  };

  // Rule handlers
  const handleCreateRule = async () => {
    if (!ruleName) return setToast({ msg: "Rule name required", sev: "warning" });
    try {
      await automationApi.createRule({
        name: ruleName, condition_type: condType, operator: op,
        threshold: Number(threshold), actions: ["notification", "email"],
      });
      setToast({ msg: "Rule created", sev: "success" });
      setRuleName("");
      load();
    } catch (e) {
      setToast({ msg: "Failed to create rule", sev: "error" });
    }
  };
  const handleToggleRule = async (id, enabled) => {
    await automationApi.updateRule(id, { enabled });
    load();
  };
  const handleDeleteRule = async (id) => {
    await automationApi.deleteRule(id);
    load();
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Automation Center
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Schedule scans, configure alerts, and let CyberShield proactively monitor your security.
      </Typography>

      <Grid container spacing={3}>
        {/* Scheduled scans */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Scheduled Repository Scans
              </Typography>
              <Stack spacing={1.5} mb={2}>
                <TextField select label="Project" size="small" value={projId}
                  onChange={(e) => setProjId(e.target.value)} fullWidth>
                  <MenuItem value="">Select project</MenuItem>
                  {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
                <TextField label="Repository URL" size="small" placeholder="https://github.com/owner/repo"
                  value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} fullWidth />
                <TextField select label="Frequency" size="small" value={freq}
                  onChange={(e) => setFreq(e.target.value)} fullWidth>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </TextField>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSchedule}>
                  Add Schedule
                </Button>
              </Stack>
              <Divider sx={{ my: 1 }} />
              {schedules.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No schedules yet.</Typography>
              ) : (
                schedules.map((s) => (
                  <ScheduleCard key={s.id} schedule={s} projectName={projectName(s.project_id)}
                    onToggle={handleToggleSchedule} onDelete={handleDeleteSchedule}
                    onUpdate={handleUpdateSchedule} onRun={handleRun} />
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Automation rules */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Automation Rules
              </Typography>
              <Stack spacing={1.5} mb={2}>
                <TextField label="Rule name" size="small" value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)} fullWidth />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField select label="Condition" size="small" value={condType}
                      onChange={(e) => setCondType(e.target.value)} fullWidth>
                      {CONDITIONS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField select label="Op" size="small" value={op}
                      onChange={(e) => setOp(e.target.value)} fullWidth>
                      <MenuItem value="gt">&gt;</MenuItem>
                      <MenuItem value="gte">≥</MenuItem>
                      <MenuItem value="lt">&lt;</MenuItem>
                      <MenuItem value="lte">≤</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField label="Threshold" size="small" type="number" value={threshold}
                      onChange={(e) => setThreshold(e.target.value)} fullWidth />
                  </Grid>
                </Grid>
                <Box>
                  {ACTIONS.map((a) => <Chip key={a} label={a} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRule}>
                  Add Rule
                </Button>
              </Stack>
              <Divider sx={{ my: 1 }} />
              {rules.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No rules yet.</Typography>
              ) : (
                rules.map((r) => (
                  <AutomationRule key={r.id} rule={r}
                    onToggle={handleToggleRule} onDelete={handleDeleteRule} />
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.sev || "info"} onClose={() => setToast(null)}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
