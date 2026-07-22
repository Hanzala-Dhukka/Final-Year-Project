/**
 * CyberShield Typography
 * Inter is the single font family (with system fallback).
 * Sizes and weights are strictly defined tokens.
 */

const typography = {
  fontFamily: "'Inter', system-ui, sans-serif",

  fontFamilyFallback: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",

  // Font weights
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Type scale (in px). Components must use these exact sizes.
  sizes: {
    display: "48px",
    h1: "36px",
    h2: "30px",
    h3: "24px",
    h4: "20px",
    h5: "18px",
    bodyLarge: "16px",
    body: "14px",
    small: "12px",
  },

  // Line heights paired to each scale step
  lineHeight: {
    display: 1.1,
    h1: 1.15,
    h2: 1.2,
    h3: 1.3,
    h4: 1.35,
    h5: 1.4,
    bodyLarge: 1.5,
    body: 1.5,
    small: 1.4,
  },

  // Semantic style objects for convenience
  styles: {
    display: {
      fontSize: "48px",
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
    },
    h1: {
      fontSize: "36px",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.015em",
    },
    h2: {
      fontSize: "30px",
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "20px",
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h5: {
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    bodyLarge: {
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body: {
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    small: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },
};

export default typography;
