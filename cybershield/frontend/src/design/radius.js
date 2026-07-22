/**
 * CyberShield Border Radius
 * Closed set of allowed values. Never mix arbitrary radii.
 */

const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  full: "999px",
};

// Default radius for general surfaces/cards.
const DEFAULT = radius.lg;

export default radius;
export { DEFAULT as defaultRadius };
