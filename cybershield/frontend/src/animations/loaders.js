import { EASE, DURATION } from "./variants";

/** Skeleton shimmer (visual handled in CSS; this is the timing token). */
export const shimmer = { duration: 1.4 };

/** Spinner rotation per-frame handled in CSS; export for reference. */
export const spin = { duration: 0.7 };

/** Loading overlay entrance. */
export const overlayIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.modal, ease: EASE } },
  exit: { opacity: 0, transition: { duration: DURATION.modal, ease: EASE } },
};

/** Progress bar grow (0% -> target). */
export const progressGrow = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: DURATION.card, ease: EASE } },
};
