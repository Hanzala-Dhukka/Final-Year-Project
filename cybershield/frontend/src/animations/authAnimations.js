/**
 * authAnimations.js
 * Framer Motion variants for the premium login experience (Module B1.1).
 * All animations use transform/opacity only (cheap, GPU-friendly).
 */

export const cardEntrance = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export const brandEntrance = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export const shieldPulse = {
  animate: { scale: [1, 1.08, 1], opacity: [0.92, 1, 0.92] },
  transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
};

export const loaderShield = {
  animate: { rotate: 360 },
  transition: { duration: 2.6, repeat: Infinity, ease: "linear" },
};

export const successPop = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 260, damping: 18 },
};

// Staggered entrance for feature cards / stats.
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};
