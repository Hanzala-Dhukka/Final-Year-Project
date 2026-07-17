import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { ContentCopy, LinkOff } from "@mui/icons-material";

// Secure share dialog (Module 4.5 — Step 11).
export default function ShareDialog({ open, onClose, onGenerate, onRevoke, token, url, expiresAt }) {
  const [days, setDays] = useState(7);
  const [password, setPassword] = useState("");
  const [snack, setSnack] = useState("");

  const generate = async () => {
    const res = await onGenerate?.(days, password || null);
    if (res) setSnack("Share link generated");
  };

  const copy = () => {
    if (url) {
      navigator.clipboard?.writeText(`${window.location.origin}${url}`);
      setSnack("Link copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Secure Report Sharing</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            type="number"
            label="Expires in (days)"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            size="small"
          />
          <TextField
            label="Password (optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="small"
            type="password"
          />
          {token && (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Active link (read-only):
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  size="small"
                  value={url ? `${window.location.origin}${url}` : ""}
                  InputProps={{ readOnly: true }}
                />
                <IconButton onClick={copy} color="primary">
                  <ContentCopy />
                </IconButton>
                <IconButton onClick={() => onRevoke?.(token)} color="error">
                  <LinkOff />
                </IconButton>
              </Stack>
              {expiresAt && (
                <Typography variant="caption" color="text.secondary">
                  Expires: {new Date(expiresAt).toLocaleString()}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={generate}>
          Generate Link
        </Button>
      </DialogActions>
      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack("")}
        message={snack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Dialog>
  );
}
