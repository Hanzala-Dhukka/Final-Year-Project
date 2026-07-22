/**
 * CyberShield Animation Tokens
 * Central timing + easing. All animations derive duration/easing from here so the
 * whole app feels consistent (fast, smooth, purposeful — no bouncing/flashing).
 */
export const DURATION = {
  hover: 0.15,
  click: 0.12,
  page: 0.25,
  modal: 0.25,
  card: 0.3,
  toast: 0.25,
  drawer: 0.3,
  sidebar: 0.25,
};

export const EASE = [0.4, 0, 0.2, 1]; // standard "ease-in-out" cubic-bezier

/** Reusable Framer Motion variants. */
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.page, ease: EASE } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.card, ease: EASE } },
};

export const slideDown = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.card, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DURATION.modal, ease: EASE } },
};

export const scaleOut = {
  hidden: { opacity: 1, scale: 1 },
  show: { opacity: 0, scale: 0.96, transition: { duration: DURATION.modal, ease: EASE } },
};

export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});
