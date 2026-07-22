import { createTheme } from "@mui/material/styles";
import design from "../design";

const { colors, typography, radius, shadows } = design;

/**
 * CyberShield MUI Theme — dark-first, fully driven by the design system tokens.
 * Any component using MUI primitives automatically inherits these values.
 * `mode` ("dark" | "light") keeps MUI in sync with the global ThemeProvider.
 */
export function createCyberShieldTheme(mode = "dark") {
  return createTheme({
    palette: {
      mode,

      primary: {
        main: colors.primary.DEFAULT,
        hover: colors.primary.hover,
        active: colors.primary.active,
        contrastText: colors.white,
      },

      secondary: {
        main: colors.secondary.DEFAULT,
      },

      success: { main: colors.status.success },
      warning: { main: colors.status.warning },
      error: { main: colors.status.danger },
      info: { main: colors.status.info },

      background: {
        default: colors.background.DEFAULT,
        paper: colors.card.DEFAULT,
      },

      text: {
        primary: colors.text.DEFAULT,
        secondary: colors.text.secondary,
        disabled: colors.text.disabled,
      },

      divider: colors.border.DEFAULT,
    },

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
            backgroundColor: colors.card.DEFAULT,
            border: `1px solid ${colors.card.border}`,
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
            backgroundColor: colors.card.DEFAULT,
            border: `1px solid ${colors.card.border}`,
            borderRadius: radius.lg,
            boxShadow: shadows.card,
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": { boxShadow: shadows.cardHover, transform: "translateY(-4px)" },
          },
        },
      },
    },
  });
}

export default createCyberShieldTheme;
