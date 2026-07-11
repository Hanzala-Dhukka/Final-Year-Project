import { createTheme } from "@mui/material/styles";
import colors from "./colors";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: colors.primary,
    },

    secondary: {
      main: colors.secondary,
    },

    success: {
      main: colors.success,
    },

    warning: {
      main: colors.warning,
    },

    error: {
      main: colors.error,
    },

    background: {
      default: colors.background,
      paper: colors.paper,
    },

    text: {
      primary: colors.text,
      secondary: colors.textSecondary,
    },
  },

  typography: {
    fontFamily: "Poppins, sans-serif",

    h1: {
      fontSize: 34,
      fontWeight: 700,
    },

    h2: {
      fontSize: 28,
      fontWeight: 700,
    },

    h3: {
      fontSize: 24,
      fontWeight: 600,
    },

    h4: {
      fontSize: 20,
      fontWeight: 600,
    },

    h5: {
      fontSize: 18,
      fontWeight: 600,
    },

    body1: {
      fontSize: 16,
    },

    body2: {
      fontSize: 14,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 12,
  },
});

export default theme;