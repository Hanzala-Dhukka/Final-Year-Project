import { Card, CardContent, Typography, Chip, Avatar, Stack, IconButton } from "@mui/material";
import { Person, AdminPanelSettings, Delete } from "@mui/icons-material";

const ROLE_COLOR = {
  Owner: "gold",
  Admin: "secondary",
  Developer: "info",
  Viewer: "default",
};

// Team member card (Module 4.5 — Team Members).
export default function MemberCard({ member, canManage, onRemove }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar>
            <Person />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>{member.user_name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {member.email}
            </Typography>
          </Box>
          <Chip
            icon={member.role === "Owner" || member.role === "Admin" ? <AdminPanelSettings /> : null}
            label={member.role}
            color={ROLE_COLOR[member.role] || "default"}
            size="small"
          />
          {canManage && member.role !== "Owner" && (
            <IconButton size="small" color="error" onClick={() => onRemove?.(member)}>
              <Delete fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
