/**
 * CyberShield Color Palette
 * Single source of truth for ALL colors in the application.
 * No raw hex values should be hard-coded anywhere in components.
 */

const colors = {
  // ---- Brand ----
  primary: {
    DEFAULT: "#2563EB", // Primary Blue
    hover: "#1D4ED8",
    active: "#1E40AF",
    soft: "rgba(37, 99, 235, 0.12)",
  },

  // ---- Surfaces (Dark-first) ----
  background: {
    DEFAULT: "#0F172A", // Dark Navy
    sidebar: "#1E293B", // Dark Slate
    elevated: "#111827", // Card
    overlay: "rgba(15, 23, 42, 0.72)",
  },

  secondary: {
    DEFAULT: "#1E293B",
    hover: "#334155",
    soft: "rgba(30, 41, 59, 0.6)",
  },

  card: {
    DEFAULT: "#111827",
    hover: "#1A2438",
    border: "rgba(148, 163, 184, 0.12)",
  },

  // ---- Accents ----
  accent: {
    cyan: "#06B6D4",
    purple: "#7C3AED",
    cyanSoft: "rgba(6, 182, 212, 0.12)",
    purpleSoft: "rgba(124, 58, 237, 0.12)",
  },

  // ---- Status ----
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    neutral: "#64748B",
    successSoft: "rgba(16, 185, 129, 0.12)",
    warningSoft: "rgba(245, 158, 11, 0.12)",
    dangerSoft: "rgba(239, 68, 68, 0.12)",
    infoSoft: "rgba(59, 130, 246, 0.12)",
    neutralSoft: "rgba(100, 116, 139, 0.12)",
  },

  // ---- Severity (security context) ----
  severity: {
    critical: "#DC2626",
    high: "#EA580C",
    medium: "#D97706",
    low: "#16A34A",
    info: "#3B82F6",
  },

  // ---- Chart colors (avoid rainbow) ----
  chart: {
    primary: "#2563EB",
    secondary: "#7C3AED",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    neutral: "#64748B",
    series: ["#2563EB", "#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"],
  },

  // ---- Text (on dark surfaces) ----
  text: {
    DEFAULT: "#F1F5F9",
    secondary: "#94A3B8",
    muted: "#64748B",
    disabled: "#475569",
    inverse: "#0F172A",
  },

  // ---- Borders ----
  border: {
    DEFAULT: "rgba(148, 163, 184, 0.12)",
    strong: "rgba(148, 163, 184, 0.24)",
    subtle: "rgba(148, 163, 184, 0.08)",
  },

  // ---- Neutral scale (used sparingly) ----
  neutral: {
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#94A3B8",
    gray500: "#64748B",
    gray600: "#475569",
    gray700: "#334155",
    gray800: "#1E293B",
    gray900: "#0F172A",
  },

  // ---- Glassmorphism ----
  glass: {
    bg: "rgba(17, 24, 39, 0.70)",
    border: "rgba(255, 255, 255, 0.10)",
    blur: "12px",
  },

  // ---- Misc ----
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

export default colors;
