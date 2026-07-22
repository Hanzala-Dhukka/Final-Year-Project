/**
 * CyberShield Themes
 * Two complete themes (dark default + light). Both expose the SAME keys so any
 * theme-aware component / CSS variable can switch without restructuring.
 *
 * Each value maps 1:1 to a CSS custom property defined in styles/theme.css:
 *   key  ->  --<cssVarName>
 * The ThemeProvider writes these onto document.documentElement.
 */

// Shared brand constants (identical across themes for brand consistency)
const BRAND = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  accentCyan: "#06B6D4",
  accentPurple: "#7C3AED",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  neutral: "#64748B",
};

export const darkTheme = {
  name: "dark",
  label: "Dark",

  // Surfaces
  bgPrimary: "#0F172A", // app background (dark navy)
  bgSecondary: "#1E293B", // sidebar (dark slate)
  cardBg: "#111827", // cards
  navbarBg: "#111827",
  sidebarBg: "#1E293B",
  surfaceHover: "#1A2438",

  // Text
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textInverse: "#0F172A",

  // Brand / status
  ...BRAND,

  // Soft status backgrounds (for badges/alerts)
  successSoft: "rgba(16, 185, 129, 0.12)",
  warningSoft: "rgba(245, 158, 11, 0.12)",
  dangerSoft: "rgba(239, 68, 68, 0.12)",
  infoSoft: "rgba(59, 130, 246, 0.12)",
  neutralSoft: "rgba(100, 116, 139, 0.12)",

  // Borders & shadows
  borderColor: "rgba(148, 163, 184, 0.12)",
  borderStrong: "rgba(148, 163, 184, 0.24)",
  shadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
  shadowSoft: "0 1px 2px rgba(0, 0, 0, 0.35)",
  glow: "0 0 20px rgba(37, 99, 235, 0.45)",

  // Glass
  glassBg: "rgba(17, 24, 39, 0.70)",
  glassBorder: "rgba(255, 255, 255, 0.10)",

  // Scrollbar
  scrollbarTrack: "#0F172A",
  scrollbarThumb: "#334155",
  scrollbarThumbHover: "#475569",

  // Chart helpers
  chartGrid: "rgba(148, 163, 184, 0.12)",
  chartLabel: "#94A3B8",

  // Logo treatment
  logoFilter: "brightness(0) invert(1)", // white logo on dark
};

export const lightTheme = {
  name: "light",
  label: "Light",

  // Surfaces
  bgPrimary: "#F5F7FA", // light app background
  bgSecondary: "#FFFFFF", // sidebar
  cardBg: "#FFFFFF", // cards
  navbarBg: "#FFFFFF",
  sidebarBg: "#FFFFFF",
  surfaceHover: "#F1F5F9",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  textInverse: "#FFFFFF",

  // Brand / status (brand colors stay constant; success/danger tuned slightly)
  ...BRAND,

  // Soft status backgrounds (for badges/alerts)
  successSoft: "rgba(16, 185, 129, 0.12)",
  warningSoft: "rgba(245, 158, 11, 0.14)",
  dangerSoft: "rgba(239, 68, 68, 0.10)",
  infoSoft: "rgba(59, 130, 246, 0.12)",
  neutralSoft: "rgba(100, 116, 139, 0.12)",

  // Borders & shadows
  borderColor: "rgba(15, 23, 42, 0.10)",
  borderStrong: "rgba(15, 23, 42, 0.18)",
  shadow: "0 4px 16px rgba(15, 23, 42, 0.10)",
  shadowSoft: "0 1px 2px rgba(15, 23, 42, 0.08)",
  glow: "0 0 20px rgba(37, 99, 235, 0.30)",

  // Glass
  glassBg: "rgba(255, 255, 255, 0.70)",
  glassBorder: "rgba(15, 23, 42, 0.10)",

  // Scrollbar
  scrollbarTrack: "#F1F5F9",
  scrollbarThumb: "#CBD5E1",
  scrollbarThumbHover: "#94A3B8",

  // Chart helpers
  chartGrid: "rgba(15, 23, 42, 0.10)",
  chartLabel: "#475569",

  // Logo treatment
  logoFilter: "none", // dark logo on light
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
};

export default themes;
