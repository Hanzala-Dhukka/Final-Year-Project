import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Avatar,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import { Send, Delete, Person } from "@mui/icons-material";

// Comment box + list (Module 4.5 — Step 8).
export default function CommentBox({ comments = [], canComment, onAdd, onDelete }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onAdd?.(text.trim());
    setText("");
  };

  return (
    <Box>
      {canComment && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Button variant="contained" endIcon={<Send />} onClick={submit}>
            Send
          </Button>
        </Stack>
      )}

      <Stack spacing={1.5}>
        {comments.length === 0 && (
          <Typography color="text.secondary">No comments yet.</Typography>
        )}
        {comments.map((c) => (
          <Card key={c.id} variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar sx={{ width: 32, height: 32 }}>
                  <Person fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {c.user_name}
                  </Typography>
                  <Typography variant="body2">{c.content}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                  </Typography>
                </Box>
                {onDelete && (
                  <IconButton size="small" onClick={() => onDelete(c)}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
