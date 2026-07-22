import { EASE, DURATION } from "./variants";

/** Page enter/exit used by AnimatedPage for route transitions. */
export const pageEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.page, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.page, ease: EASE } },
};

/** Alternative: fade + slight scale, for modal-like routes. */
export const pageFadeScale = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATION.page, ease: EASE } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.page, ease: EASE } },
};
