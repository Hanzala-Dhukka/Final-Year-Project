/**
 * Shared Framer Motion animation variants for the CyberShield UI library.
 * Import these into any component to keep motion consistent (A1 principles).
 */
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
};

export const staggerList = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

export const overlayFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const drawerRight = {
  hidden: { x: "100%" },
  show: { x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: "100%", transition: { duration: 0.2 } },
};

export const drawerLeft = {
  hidden: { x: "-100%" },
  show: { x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: "-100%", transition: { duration: 0.2 } },
};

export const drawerTop = {
  hidden: { y: "-100%" },
  show: { y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { y: "-100%", transition: { duration: 0.2 } },
};

export const drawerBottom = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { y: "100%", transition: { duration: 0.2 } },
};

export const EASE = [0.4, 0, 0.2, 1];
