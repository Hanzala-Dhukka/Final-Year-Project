/**
 * CyberShield Spacing System
 * Strict 8px grid. Never use off-grid values (17, 29, 53, etc.).
 * All margin/padding/gap must come from these tokens.
 */

const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
};

// Convenience: a function-style map (numeric values in px) for programmatic use.
const scale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80];

export default spacing;
export { scale as spacingScale };
