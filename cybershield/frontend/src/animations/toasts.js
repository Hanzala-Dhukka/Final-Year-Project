import { EASE, DURATION } from "./variants";

export const toastEnter = {
  hidden: { opacity: 0, x: 24, scale: 0.96 },
  show: { opacity: 1, x: 0, scale: 1, transition: { duration: DURATION.toast, ease: EASE } },
  exit: { opacity: 0, x: 24, scale: 0.96, transition: { duration: DURATION.toast, ease: EASE } },
};

export const toastStack = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
