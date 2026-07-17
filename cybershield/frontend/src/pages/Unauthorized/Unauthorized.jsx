import { Paper, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: "#f5f7fb" }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          textAlign: "center",
          maxWidth: 500,
          borderRadius: 2,
        }}
      >
        <Typography variant="h1" color="error" gutterBottom>
          🚫
        </Typography>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          403
        </Typography>
        <Typography variant="h5" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You do not have permission to access this page.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}

export default Unauthorized;
