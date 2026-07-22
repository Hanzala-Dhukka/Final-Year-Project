import { EASE, DURATION } from "./variants";

export const modalOverlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.modal, ease: EASE } },
  exit: { opacity: 0, transition: { duration: DURATION.modal, ease: EASE } },
};

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.modal, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: DURATION.modal, ease: EASE } },
};

export const drawerRight = {
  hidden: { x: "100%" },
  show: { x: 0, transition: { duration: DURATION.drawer, ease: EASE } },
  exit: { x: "100%", transition: { duration: DURATION.drawer, ease: EASE } },
};

export const drawerLeft = {
  hidden: { x: "-100%" },
  show: { x: 0, transition: { duration: DURATION.drawer, ease: EASE } },
  exit: { x: "-100%", transition: { duration: DURATION.drawer, ease: EASE } },
};
