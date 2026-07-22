/**
 * cyberBackground.js
 * Lightweight configuration + helpers for the login cyber background.
 * Keeping these as plain data makes the JSX components easy to tweak.
 */

// Two soft glow blobs that sit behind the grid.
export const GLOWS = [
  { className: "glow-one", color: "#06b6d4", top: "-120px", left: "-120px" },
  { className: "glow-two", color: "#7c3aed", bottom: "-120px", right: "-120px" },
];

// Reusable framer-motion variants for the background glows (gentle drift).
export const glowVariants = {
  animate: (i) => ({
    x: [0, i % 2 === 0 ? 30 : -30, 0],
    y: [0, i % 2 === 0 ? -20 : 20, 0],
    transition: { duration: 14 + i * 3, repeat: Infinity, ease: "easeInOut" },
  }),
};
