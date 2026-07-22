/**
 * CyberShield Shadows
 * Reusable elevation tokens. Cards and buttons share these only.
 */

const shadows = {
  none: "none",

  // Soft shadow for dashboard cards
  small: "0 1px 2px rgba(0, 0, 0, 0.30)",

  // Medium shadow for floating panels
  medium: "0 4px 12px rgba(0, 0, 0, 0.35)",

  // Large shadow (modals, popovers)
  large: "0 12px 32px rgba(0, 0, 0, 0.45)",

  // Glow (accent emphasis)
  glow: "0 0 20px rgba(37, 99, 235, 0.45)",
  glowCyan: "0 0 20px rgba(6, 182, 212, 0.40)",
  glowPurple: "0 0 20px rgba(124, 58, 237, 0.40)",

  // Card-specific
  card: "0 4px 16px rgba(0, 0, 0, 0.35)",
  cardHover: "0 8px 28px rgba(0, 0, 0, 0.45)",

  // Button-specific
  button: "0 2px 8px rgba(0, 0, 0, 0.30)",
  buttonHover: "0 4px 14px rgba(37, 99, 235, 0.35)",
};

export default shadows;
