import { createTheme } from "@mui/material/styles";
import design from "../design";
import { themes } from "../theme/themes";

const { typography, radius, shadows } = design;

/**
 * CyberShield MUI Theme — fully theme-aware (dark + light).
 *
 * The palette is rebuilt from the active `themes[mode]` token set so MUI
 * primitives (Card, Typography, Paper, Menu, Select, Tooltip, progress, etc.)
 * always match the global CSS theme. This fixes dark cards / invisible text
 * appearing when the app is switched to light mode.
 */
export function createCyberShieldTheme(mode = "dark") {
  const t = themes[mode] || themes.dark;

  const palette = {
    mode,

    primary: {
      main: t.primary || "#2563EB",
      hover: t.primaryHover || "#1D4ED8",
      active: "#1E40AF",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: t.bgSecondary || "#1E293B",
    },

    success: { main: t.success || "#10B981" },
    warning: { main: t.warning || "#F59E0B" },
    error: { main: t.danger || "#EF4444" },
    info: { main: t.info || "#3B82F6" },

    background: {
      default: t.bgPrimary,
      paper: t.cardBg,
    },

    text: {
      primary: t.textPrimary,
      secondary: t.textSecondary,
      disabled: t.textMuted,
    },

    divider: t.borderColor,
  };

  return createTheme({
    palette,
    typography: {
      fontFamily: typography.fontFamily,
      fontWeightRegular: typography.weights.regular,
      fontWeightMedium: typography.weights.medium,
      fontWeightBold: typography.weights.bold,

      h1: { fontSize: 36, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.015em" },
      h2: { fontSize: 30, fontWeight: 600, lineHeight: 1.2 },
      h3: { fontSize: 24, fontWeight: 600, lineHeight: 1.3 },
      h4: { fontSize: 20, fontWeight: 600, lineHeight: 1.35 },
      h5: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
      body2: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 600 },
    },

    shape: {
      borderRadius: parseInt(radius.lg, 10),
    },

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: t.cardBg,
            border: `1px solid ${t.borderColor}`,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            textTransform: "none",
            fontWeight: typography.weights.semibold,
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          },
          containedPrimary: {
            boxShadow: shadows.button,
            "&:hover": { boxShadow: shadows.buttonHover, transform: "scale(0.98)" },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: t.cardBg,
            border: `1px solid ${t.borderColor}`,
            borderRadius: radius.lg,
            boxShadow: shadows.card,
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": { boxShadow: shadows.cardHover },
          },
        },
      },
    },
  });
}

export default createCyberShieldTheme;
