import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { keyframes } from "@emotion/react";
import toast from "react-hot-toast";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Chip,
  Tooltip,
  Divider,
  Avatar,
  Skeleton,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowLeft,
  Layers,
  Sun,
  Moon,
  RefreshCw,
  FileText,
  ShieldAlert,
  CalendarDays,
  GitCompareArrows,
  Share2,
  Copy,
  Check,
  Trash2,
  Send,
  MessageSquare,
  Clock,
  ChevronRight,
  Download,
  KeyRound,
  FolderGit2,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { projectApi } from "../../api/projectApi";
import { API_BASE_URL } from "../../api/api";
import { useTheme } from "../../theme/useTheme";
import { scoreColor } from "../../components/ThreatDashboard/severity";
import RiskGauge from "../../components/Projects/RiskGauge";
import SectionCard from "../../components/Projects/SectionCard";
import KpiTile from "../../components/Projects/KpiTile";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const STATUS_META = {
  Active: { color: "#22C55E", bg: "rgba(34,197,94,0.14)", label: "Active" },
  "On Hold": { color: "#F59E0B", bg: "rgba(245,158,11,0.14)", label: "On Hold" },
  Archived: { color: "#94A3B8", bg: "rgba(148,163,184,0.16)", label: "Archived" },
  Review: { color: "#3B82F6", bg: "rgba(59,130,246,0.14)", label: "In Review" },
};

const SEV_ROW = [
  { key: "critical", label: "Critical", color: "#e11d48" },
  { key: "high", label: "High", color: "#f97316" },
  { key: "medium", label: "Medium", color: "#eab308" },
  { key: "low", label: "Low", color: "#22c55e" },
];

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

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ── Version list row ──────────────────────────────────── */
function VersionRow({ report, selected, onSelect }) {
  const color = scoreColor(report.risk_score);
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onSelect(report)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(report);
        }
      }}
      sx={{
        borderRadius: 2,
        border: `1px solid ${selected ? `${color}66` : "var(--borderColor)"}`,
        background: selected ? `${color}0d` : "var(--surfaceHover)",
        cursor: "pointer",
        px: 1.75,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        transition: "border-color 200ms ease, background 200ms ease, transform 200ms ease",
        "&:hover": { borderColor: `${color}66`, transform: "translateX(2px)" },
        "&:focus-visible": { outline: "2px solid var(--primary)" },
      }}
    >
      <Box sx={{ width: 8, height: 38, borderRadius: 99, bgcolor: color, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "var(--textPrimary)" }}>
            Version {report.version}
          </Typography>
          {selected && (
            <Chip
              label="Selected"
              size="small"
              sx={{
                height: 18,
                fontSize: 9.5,
                fontWeight: 800,
                color: "#fff",
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                "& .MuiChip-label": { px: 0.9 },
              }}
            />
          )}
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.4 }}>
          <Clock size={11} style={{ color: "var(--textMuted)" }} />
          <Typography sx={{ fontSize: 11, color: "var(--textMuted)", fontWeight: 600 }}>
            {fmtDate(report.created_at)}
          </Typography>
        </Stack>
      </Box>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Chip
          label={report.risk_level || "Unknown"}
          size="small"
          sx={{
            height: 22,
            fontSize: 10.5,
            fontWeight: 800,
            color,
            bgcolor: `${color}1a`,
            border: `1px solid ${color}55`,
            "& .MuiChip-label": { px: 1 },
          }}
        />
        <Typography sx={{ fontSize: 14, fontWeight: 900, color }}>{report.risk_score}</Typography>
      </Stack>
    </Box>
  );
}

/* ── Severity distribution ─────────────────────────────── */
function SeverityDistribution({ dist }) {
  const hasAny = SEV_ROW.some((s) => Number(dist?.[s.key] || 0) > 0);
  if (!hasAny) return null;
  const max = Math.max(1, ...SEV_ROW.map((s) => Number(dist?.[s.key] || 0)));
  return (
    <Stack spacing={1}>
      {SEV_ROW.map((s) => {
        const count = Number(dist?.[s.key] || 0);
        const pct = (count / max) * 100;
        return (
          <Box key={s.key}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "var(--textSecondary)" }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontSize: 11.5, fontWeight: 900, color: s.color }}>{count}</Typography>
            </Stack>
            <Box sx={{ height: 7, borderRadius: 99, background: "var(--borderColor)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: 99, background: s.color }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

/* ── Threat rows from report data ──────────────────────── */
function ThreatList({ threats }) {
  const items = (Array.isArray(threats) ? threats : [])
    .map((t) =>
      typeof t === "string"
        ? { name: t, severity: "", score: null }
        : {
            name: t.name || t.threat || t.title || "",
            severity: t.severity || t.risk_level || "",
            score: t.score ?? t.risk_score ?? null,
          }
    )
    .filter((t) => t.name);

  if (items.length === 0) return null;

  return (
    <Stack spacing={1}>
      {items.map((t, i) => {
        const sev = SEV_ROW.find(
          (s) => s.label.toLowerCase() === String(t.severity || "").toLowerCase()
        );
        const color = sev?.color || "#64748B";
        return (
          <Stack
            key={i}
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 1.75,
              background: "var(--surfaceHover)",
              border: "1px solid var(--borderColor)",
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1.25,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color,
                bgcolor: `${color}1a`,
                border: `1px solid ${color}44`,
              }}
            >
              {i + 1}
            </Box>
            <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: "var(--textPrimary)", minWidth: 0 }}>
              {t.name}
            </Typography>
            {t.severity && (
              <Chip
                label={t.severity}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  color,
                  bgcolor: `${color}1a`,
                  border: `1px solid ${color}44`,
                  "& .MuiChip-label": { px: 0.9 },
                }}
              />
            )}
            {t.score != null && (
              <Typography sx={{ fontSize: 12.5, fontWeight: 900, color }}>{t.score}</Typography>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

/* ── Report detail view ────────────────────────────────── */
function ReportDetail({ detail }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return (
      <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
        No detailed findings stored for this version.
      </Typography>
    );
  }

  const dist = detail.distribution || detail.severity_distribution || {};
  const threats = detail.threats || [];
  const summary =
    detail.summary || detail.executive_summary || detail.threat_summary || "";

  const ignored = new Set([
    "distribution",
    "severity_distribution",
    "threats",
    "summary",
    "executive_summary",
    "threat_summary",
  ]);
  const meta = Object.entries(detail).filter(
    ([k, v]) =>
      !ignored.has(k) &&
      v !== null &&
      v !== undefined &&
      v !== "" &&
      !(typeof v === "object")
  );

  return (
    <Stack spacing={2.25}>
      {summary && (
        <Box
          sx={{
            px: 1.75,
            py: 1.5,
            borderRadius: 2,
            background: "var(--surfaceHover)",
            border: "1px solid var(--borderColor)",
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
            Summary
          </Typography>
          <Typography sx={{ fontSize: 13, color: "var(--textSecondary)", lineHeight: 1.6 }}>
            {summary}
          </Typography>
        </Box>
      )}

      <SeverityDistribution dist={dist} />
      <ThreatList threats={threats} />

      {meta.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
            Report Metadata
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.25,
            }}
          >
            {meta.map(([k, v]) => (
              <Box
                key={k}
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 1.75,
                  background: "var(--surfaceHover)",
                  border: "1px solid var(--borderColor)",
                }}
              >
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "var(--textMuted)", textTransform: "capitalize" }}>
                  {k.replace(/_/g, " ")}
                </Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--textPrimary)", mt: 0.25, wordBreak: "break-word" }}>
                  {typeof v === "string" ? v : JSON.stringify(v)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box>
        <Button
          size="small"
          onClick={() => setShowRaw((s) => !s)}
          sx={{ fontSize: 12, fontWeight: 800, color: "#2563EB", "&:hover": { bgcolor: "rgba(37,99,235,0.10)" } }}
        >
          {showRaw ? "Hide" : "View"} raw JSON
        </Button>
        <AnimatePresence initial={false}>
          {showRaw && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  maxHeight: 300,
                  overflow: "auto",
                  m: 0,
                  p: 1.75,
                  borderRadius: 2,
                  fontSize: 11.5,
                  lineHeight: 1.6,
                  color: "var(--textSecondary)",
                  background: "var(--surfaceHover)",
                  border: "1px solid var(--borderColor)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {JSON.stringify(detail, null, 2)}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Stack>
  );
}

/* ── Compare panel ─────────────────────────────────────── */
function ComparePanel({ versions, onCompare }) {
  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const [a, setA] = useState(sorted[0]?.version ?? "");
  const [b, setB] = useState(sorted[1]?.version ?? "");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sorted.length >= 2) {
      setA(sorted[0].version);
      setB(sorted[1].version);
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions.length]);

  const run = async () => {
    if (!a || !b || a === b) return;
    setBusy(true);
    try {
      const res = await onCompare(a, b);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  if (sorted.length < 2) {
    return (
      <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
        At least two report versions are required to compare.
      </Typography>
    );
  }

  const diffColor = (d) => (d > 0 ? "#E11D48" : d < 0 ? "#22C55E" : "var(--textMuted)");
  const diffIcon = (d) => (d > 0 ? <ArrowUpRight size={15} /> : d < 0 ? <ArrowDownRight size={15} /> : null);

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
          gap: 1.25,
          alignItems: "center",
        }}
      >
        <TextField
          select
          size="small"
          label="Version A"
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          sx={inputSx}
        >
          {sorted.map((v) => (
            <MenuItem key={v.id} value={v.version}>
              v{v.version} · {v.risk_level}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          onClick={run}
          disabled={!a || !b || a === b || busy}
          startIcon={
            busy ? (
              <Box component="span" sx={{ display: "inline-flex", animation: `${spin} 1s linear infinite` }}>
                <RefreshCw size={15} />
              </Box>
            ) : (
              <GitCompareArrows size={15} />
            )
          }
          sx={{
            background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
            whiteSpace: "nowrap",
            "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
          }}
        >
          Compare
        </Button>
        <TextField
          select
          size="small"
          label="Version B"
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          sx={inputSx}
        >
          {sorted.map((v) => (
            <MenuItem key={v.id} value={v.version}>
              v{v.version} · {v.risk_level}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <AnimatePresence initial={false}>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                mt: 2,
                p: 1.75,
                borderRadius: 2,
                background: "var(--surfaceHover)",
                border: "1px solid var(--borderColor)",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.75 }}>
                <Box
                  sx={{
                    flex: 1,
                    p: 1.25,
                    borderRadius: 1.75,
                    textAlign: "center",
                    bgcolor: `${scoreColor(result.risk_a)}14`,
                    border: `1px solid ${scoreColor(result.risk_a)}44`,
                  }}
                >
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "var(--textMuted)", textTransform: "uppercase" }}>
                    v{result.version_a}
                  </Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 900, color: scoreColor(result.risk_a), lineHeight: 1.1 }}>
                    {result.risk_a}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center", color: "var(--textMuted)" }}>
                  <ChevronRight size={22} />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 1.25,
                    borderRadius: 1.75,
                    textAlign: "center",
                    bgcolor: `${scoreColor(result.risk_b)}14`,
                    border: `1px solid ${scoreColor(result.risk_b)}44`,
                  }}
                >
                  <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "var(--textMuted)", textTransform: "uppercase" }}>
                    v{result.version_b}
                  </Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 900, color: scoreColor(result.risk_b), lineHeight: 1.1 }}>
                    {result.risk_b}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
                <Box
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.75,
                    bgcolor: `${diffColor(result.risk_diff)}14`,
                    border: `1px solid ${diffColor(result.risk_diff)}44`,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  {diffIcon(result.risk_diff)}
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: diffColor(result.risk_diff) }}>
                    {result.risk_diff > 0 ? `+${result.risk_diff}` : result.risk_diff} risk
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.75,
                    bgcolor: `${diffColor(result.new_threats)}14`,
                    border: `1px solid ${diffColor(result.new_threats)}44`,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <ArrowUpRight size={15} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: diffColor(result.new_threats) }}>
                    {result.new_threats} new threat{result.new_threats === 1 ? "" : "s"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.75,
                    bgcolor: `${diffColor(result.resolved_threats)}14`,
                    border: `1px solid ${diffColor(result.resolved_threats)}44`,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <ArrowDownRight size={15} />
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: diffColor(result.resolved_threats) }}>
                    {result.resolved_threats} resolved
                  </Typography>
                </Box>
              </Stack>

              {result.details?.length > 0 && (
                <Stack spacing={0.75}>
                  {result.details.map((d) => {
                    const sev = SEV_ROW.find((s) => s.key === d.severity);
                    const color = sev?.color || "#64748B";
                    const sign = d.delta > 0 ? "+" : "";
                    return (
                      <Stack
                        key={d.severity}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          px: 1.5,
                          py: 0.9,
                          borderRadius: 1.5,
                          background: "var(--cardBg)",
                          border: "1px solid var(--borderColor)",
                        }}
                      >
                        <Box sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: color, flexShrink: 0 }} />
                        <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 800, color: "var(--textPrimary)", textTransform: "capitalize" }}>
                          {d.severity}
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--textSecondary)" }}>
                          {d.from} → {d.to}
                        </Typography>
                        <Chip
                          label={`${sign}${d.delta}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: d.delta > 0 ? "#E11D48" : "#22C55E",
                            bgcolor: d.delta > 0 ? "rgba(225,29,72,0.12)" : "rgba(34,197,94,0.12)",
                            border: `1px solid ${d.delta > 0 ? "rgba(225,29,72,0.4)" : "rgba(34,197,94,0.4)"}`,
                            "& .MuiChip-label": { px: 0.9 },
                          }}
                        />
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

/* ── Share dialog ──────────────────────────────────────── */
function ShareDialog({ open, onClose, report, onGenerate, onRevoke }) {
  const [days, setDays] = useState(7);
  const [password, setPassword] = useState("");
  const [share, setShare] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setShare(null);
      setCopied(false);
      setPassword("");
      setDays(7);
    }
  }, [open]);

  const generate = async () => {
    if (!report) return;
    setBusy(true);
    try {
      const data = await onGenerate(days, password || null);
      setShare(data);
      toast.success("Share link generated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Share failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!share) return;
    const full = `${API_BASE_URL}${share.url}`;
    try {
      await navigator.clipboard?.writeText(full);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const revoke = async () => {
    if (!share) return;
    try {
      await onRevoke(share.token);
      setShare(null);
      toast.success("Share link revoked");
    } catch {
      toast.error("Revoke failed");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            <Share2 size={19} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800, color: "var(--textPrimary)" }}>
              Secure Report Sharing
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)" }}>
              {report ? `Share v${report.version} with read-only access` : ""}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Expires in (days)"
              type="number"
              size="small"
              fullWidth
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              sx={inputSx}
            />
            <TextField
              label="Password (optional)"
              type="password"
              size="small"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, display: "inline-flex", color: "var(--textSecondary)" }}>
                    <KeyRound size={16} />
                  </Box>
                ),
              }}
            />
          </Stack>

          {share && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: "var(--surfaceHover)",
                border: "1px solid var(--borderColor)",
              }}
            >
              <Stack spacing={1}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Active read-only link
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    component="code"
                    sx={{
                      flex: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      fontSize: 12,
                      color: "var(--textPrimary)",
                      background: "var(--glassBg)",
                      border: "1px solid var(--borderColor)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {`${API_BASE_URL}${share.url}`}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={copy}
                    sx={{ color: copied ? "#22C55E" : "var(--textSecondary)", "&:hover": { bgcolor: "var(--surfaceHover)" } }}
                  >
                    {copied ? <Check size={17} /> : <Copy size={17} />}
                  </IconButton>
                  <IconButton size="small" onClick={revoke} sx={{ color: "#EF4444", "&:hover": { bgcolor: "rgba(239,68,68,0.12)" } }}>
                    <Trash2 size={17} />
                  </IconButton>
                </Stack>
                {share.expires_at && (
                  <Typography sx={{ fontSize: 11.5, color: "var(--textMuted)" }}>
                    Expires: {fmtDate(share.expires_at)}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: "var(--textSecondary)" }}>
          Close
        </Button>
        {!share && (
          <Button
            variant="contained"
            onClick={generate}
            disabled={busy}
            sx={{
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
              "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
            }}
          >
            {busy ? "Generating…" : "Generate Link"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ── Main component ────────────────────────────────────── */
export default function VersionHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [p, r] = await Promise.all([
        projectApi.get(id),
        projectApi.listReports(id),
      ]);
      setProject(p.data);
      setReports(r.data || []);
      const next = r.data?.[0] || null;
      setSelected(next);
      if (next) {
        await loadVersion(next);
      } else {
        setDetail(null);
        setComments([]);
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to load version history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadVersion = async (report) => {
    setSelected(report);
    setLoadingDetail(true);
    try {
      const [{ data: v }, { data: c }] = await Promise.all([
        projectApi.getVersion(id, report.version),
        projectApi.listComments(report.id),
      ]);
      setDetail(v.data || {});
      setComments(c || []);
    } catch {
      setDetail(null);
      setComments([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addComment = async () => {
    if (!selected || !commentText.trim()) return;
    setAddingComment(true);
    try {
      await projectApi.addComment(selected.id, commentText.trim());
      const { data } = await projectApi.listComments(selected.id);
      setComments(data || []);
      setCommentText("");
      toast.success("Comment added");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Comment failed");
    } finally {
      setAddingComment(false);
    }
  };

  const deleteComment = async (comment) => {
    try {
      await projectApi.deleteComment(comment.id);
      const { data } = await projectApi.listComments(selected.id);
      setComments(data || []);
      toast.success("Comment deleted");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Delete failed");
    }
  };

  const compare = async (a, b) => {
    const { data } = await projectApi.compareVersions(id, a, b);
    return data;
  };

  const generateShare = async (days, password) => {
    if (!selected) return null;
    const { data } = await projectApi.share(id, selected.id, {
      expires_in_days: days,
      password,
    });
    return data;
  };

  const revokeShare = async (token) => {
    await projectApi.revokeShare(token);
  };

  const exportJson = () => {
    if (!selected) return;
    const payload = {
      project: project?.name || "Project",
      version: selected.version,
      risk_score: selected.risk_score,
      risk_level: selected.risk_level,
      created_at: selected.created_at,
      data: detail,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name || "project"}-v${selected.version}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as JSON");
  };

  const status = STATUS_META[project?.status] || STATUS_META.Active;
  const latest = reports[0];
  const hasRisk = latest?.risk_score != null;
  const latestRiskColor = hasRisk ? scoreColor(latest.risk_score) : "#64748B";

  const renderHeader = () => (
    <>
      {/* Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
        <Button
          onClick={() => navigate("/projects")}
          startIcon={<ArrowLeft size={16} />}
          sx={{
            px: 1,
            py: 0.5,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--textSecondary)",
            "&:hover": { bgcolor: "var(--surfaceHover)", color: "var(--textPrimary)" },
          }}
        >
          Projects
        </Button>
        <ChevronRight size={14} style={{ color: "var(--textMuted)" }} />
        <Button
          onClick={() => navigate(`/projects/${id}`)}
          sx={{
            px: 1,
            py: 0.5,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--textSecondary)",
            "&:hover": { bgcolor: "var(--surfaceHover)", color: "var(--textPrimary)" },
          }}
        >
          {project?.name || "Project"}
        </Button>
        <ChevronRight size={14} style={{ color: "var(--textMuted)" }} />
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--textMuted)" }}>
          Version History
        </Typography>
      </Stack>

      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              boxShadow: "0 10px 30px rgba(37,99,235,0.35)",
            }}
          >
            <Layers size={27} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" rowGap={0.5}>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  letterSpacing: "-0.02em",
                  color: "var(--textPrimary)",
                  fontSize: { xs: 24, md: 30 },
                  lineHeight: 1.15,
                }}
              >
                Version History
              </Typography>
              <Chip
                label={status.label}
                size="small"
                sx={{
                  height: 24,
                  fontSize: 11,
                  fontWeight: 800,
                  color: status.color,
                  bgcolor: status.bg,
                  border: `1px solid ${status.color}55`,
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            </Stack>
            <Typography sx={{ color: "var(--textSecondary)", fontSize: 13.5, mt: 0.5, lineHeight: 1.5 }}>
              {reports.length} report version{reports.length === 1 ? "" : "s"} for {project?.name || "this project"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap" rowGap={1}>
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
                "&:hover": { background: "var(--surfaceHover)", color: "var(--textPrimary)" },
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
                sx={{ display: "inline-flex", ...(refreshing ? { animation: `${spin} 1s linear infinite` } : {}) }}
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
            startIcon={<FolderGit2 size={17} />}
            onClick={() => navigate(`/projects/${id}`)}
            sx={{
              background: "var(--glassBg)",
              color: "var(--textPrimary)",
              border: "1px solid var(--glassBorder)",
              boxShadow: "none",
              "&:hover": { background: "var(--surfaceHover)" },
            }}
          >
            Back to Project
          </Button>

          <Button
            variant="contained"
            startIcon={<Share2 size={17} />}
            onClick={() => setShareOpen(true)}
            disabled={!selected}
            sx={{
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
              "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
              "&:disabled": {
                background: "var(--surfaceHover)",
                color: "var(--textMuted)",
                boxShadow: "none",
              },
            }}
          >
            Share Report
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ borderColor: "var(--borderColor)" }} />
    </>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: 2.5, bgcolor: "var(--borderColor)" }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="45%" height={34} sx={{ bgcolor: "var(--borderColor)" }} />
              <Skeleton width="60%" height={18} sx={{ bgcolor: "var(--borderColor)" }} />
            </Box>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={86} sx={{ borderRadius: 2.5, bgcolor: "var(--borderColor)", transform: "none" }} />
            ))}
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
              gap: 2.5,
            }}
          >
            <Skeleton variant="rounded" height={460} sx={{ borderRadius: 3, bgcolor: "var(--borderColor)", transform: "none" }} />
            <Skeleton variant="rounded" height={460} sx={{ borderRadius: 3, bgcolor: "var(--borderColor)", transform: "none", gridColumn: { lg: "span 2" } }} />
          </Box>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        {renderHeader()}
        <Box
          sx={{
            mt: 4,
            borderRadius: 3,
            border: "1px solid var(--dangerSoft)",
            bgcolor: "var(--dangerSoft)",
            color: "#EF4444",
            px: 3,
            py: 8,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(239,68,68,0.12)",
              color: "#EF4444",
            }}
          >
            <ShieldAlert size={28} />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800, color: "var(--textPrimary)" }}>
            Could not load version history
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "var(--textSecondary)", mt: 0.75 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => load()}
            sx={{
              mt: 2.5,
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              color: "#fff",
              "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
            }}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {renderHeader()}

      {/* ── KPI row ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
          mt: 2.5,
        }}
      >
        <KpiTile
          icon={<Layers size={20} />}
          color="#6366F1"
          value={reports.length}
          label="Total Versions"
          hint={reports.length ? `Latest is v${latest?.version}` : "No reports yet"}
        />
        <KpiTile
          icon={<ShieldAlert size={20} />}
          color={latestRiskColor}
          value={hasRisk ? latest.risk_score : "—"}
          label="Current Risk Score"
          hint={latest?.risk_level ? `Level · ${latest.risk_level}` : "No score yet"}
        />
        <KpiTile
          icon={<CalendarDays size={20} />}
          color="#06B6D4"
          value={latest ? fmtDate(latest.created_at) : "—"}
          label="Last Report"
          hint="Most recent version"
        />
        <KpiTile
          icon={<MessageSquare size={20} />}
          color="#8B5CF6"
          value={comments.length}
          label="Comments"
          hint={selected ? `On v${selected.version}` : "Select a version"}
        />
      </Box>

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" },
          gap: 2.5,
          mt: 2.5,
        }}
      >
        {/* Left: versions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SectionCard
            icon={<Layers size={17} />}
            iconColor="#6366F1"
            title="Versions"
            action={
              reports.length > 0 ? (
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--textMuted)" }}>
                  {reports.length} total
                </Typography>
              ) : undefined
            }
          >
            {reports.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
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
                    bgcolor: "rgba(99,102,241,0.10)",
                    color: "#6366F1",
                  }}
                >
                  <FileText size={26} />
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--textPrimary)" }}>
                  No report versions yet
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", mt: 0.5, lineHeight: 1.55 }}>
                  Run a threat analysis to generate the first report version for this project.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/threat-analysis")}
                  sx={{
                    mt: 2,
                    background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                    color: "#fff",
                    "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
                  }}
                >
                  Run Threat Analysis
                </Button>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {reports.map((r) => (
                  <VersionRow
                    key={r.id}
                    report={r}
                    selected={selected?.id === r.id}
                    onSelect={loadVersion}
                  />
                ))}
              </Stack>
            )}
          </SectionCard>
        </motion.div>

        {/* Right: detail + compare + comments */}
        <Box sx={{ gridColumn: { lg: "span 2" }, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <SectionCard
              icon={<FileText size={17} />}
              iconColor="#06B6D4"
              title={selected ? `Report · Version ${selected.version}` : "Report Details"}
              action={
                selected ? (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Export as JSON">
                      <IconButton size="small" onClick={exportJson} sx={{ color: "var(--textSecondary)", "&:hover": { color: "var(--textPrimary)" } }}>
                        <Download size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share this version">
                      <IconButton size="small" onClick={() => setShareOpen(true)} sx={{ color: "var(--textSecondary)", "&:hover": { color: "#2563EB" } }}>
                        <Share2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : undefined
              }
            >
              {!selected ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      mx: "auto",
                      mb: 2,
                      borderRadius: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(6,182,212,0.10)",
                      color: "#06B6D4",
                    }}
                  >
                    <FileText size={28} />
                  </Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--textPrimary)" }}>
                    Select a version to view its report
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", mt: 0.5 }}>
                    Choose a version from the list to inspect findings, compare and comment.
                  </Typography>
                </Box>
              ) : loadingDetail ? (
                <Stack spacing={2}>
                  <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2, bgcolor: "var(--borderColor)", transform: "none" }} />
                  <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2, bgcolor: "var(--borderColor)", transform: "none" }} />
                  <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2, bgcolor: "var(--borderColor)", transform: "none" }} />
                </Stack>
              ) : (
                <Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }} sx={{ mb: 2.25 }}>
                    <Box sx={{ flexShrink: 0 }}>
                      <RiskGauge score={selected.risk_score} size={148} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                        <Chip
                          label={selected.risk_level || "Unknown"}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: 11,
                            fontWeight: 800,
                            color: latestRiskColor,
                            bgcolor: `${latestRiskColor}1a`,
                            border: `1px solid ${latestRiskColor}55`,
                            "& .MuiChip-label": { px: 1.25 },
                          }}
                        />
                        <Chip
                          label={`Score ${selected.risk_score}`}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: 11,
                            fontWeight: 800,
                            color: latestRiskColor,
                            bgcolor: `${latestRiskColor}1a`,
                            border: `1px solid ${latestRiskColor}55`,
                            "& .MuiChip-label": { px: 1.25 },
                          }}
                        />
                      </Stack>
                      <Box
                        sx={{
                          mt: 1.75,
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 1.25,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Version
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--textPrimary)", mt: 0.25 }}>
                            v{selected.version}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "var(--textMuted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Generated
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--textPrimary)", mt: 0.25 }}>
                            {fmtDate(selected.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Stack>
                  <Divider sx={{ borderColor: "var(--borderColor)", mb: 2.25 }} />
                  <ReportDetail detail={detail} />
                </Box>
              )}
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SectionCard
              icon={<GitCompareArrows size={17} />}
              iconColor="#F59E0B"
              title="Compare Versions"
            >
              <ComparePanel versions={reports} onCompare={compare} />
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <SectionCard
              icon={<MessageSquare size={17} />}
              iconColor="#8B5CF6"
              title={selected ? `Comments · Version ${selected.version}` : "Comments"}
              action={
                comments.length > 0 ? (
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--textMuted)" }}>
                    {comments.length} total
                  </Typography>
                ) : undefined
              }
            >
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                {comments.length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: "var(--textMuted)" }}>
                    No comments yet. Be the first to leave feedback on this version.
                  </Typography>
                ) : (
                  comments.map((c) => (
                    <Stack key={c.id} direction="row" spacing={1.25} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 11.5,
                          fontWeight: 800,
                          color: "#fff",
                          background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                        }}
                      >
                        {initials(c.user_name)}
                      </Avatar>
                      <Box
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          px: 1.5,
                          py: 1.25,
                          borderRadius: 2,
                          background: "var(--surfaceHover)",
                          border: "1px solid var(--borderColor)",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "var(--textPrimary)" }}>
                            {c.user_name}
                          </Typography>
                          <Typography sx={{ fontSize: 10.5, color: "var(--textMuted)", fontWeight: 600 }}>
                            {fmtDate(c.created_at)}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: 12.5, color: "var(--textSecondary)", mt: 0.35, lineHeight: 1.55, wordBreak: "break-word" }}>
                          {c.content}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => deleteComment(c)}
                        sx={{ color: "var(--textMuted)", "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.12)" } }}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </Stack>
                  ))
                )}
              </Stack>

              <Divider sx={{ borderColor: "var(--borderColor)", mb: 1.75 }} />

              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                  sx={inputSx}
                  disabled={!selected}
                />
                <Button
                  variant="contained"
                  endIcon={<Send size={15} />}
                  onClick={addComment}
                  disabled={!selected || !commentText.trim() || addingComment}
                  sx={{
                    background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                    color: "#fff",
                    boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
                    whiteSpace: "nowrap",
                    "&:hover": { background: "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)" },
                  }}
                >
                  Send
                </Button>
              </Stack>
            </SectionCard>
          </motion.div>
        </Box>
      </Box>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        report={selected}
        onGenerate={generateShare}
        onRevoke={revokeShare}
      />
    </Container>
  );
}


