import { EASE, DURATION } from "./variants";

/** Card hover: lift 4px, subtle scale 1.02. Pair with shadow in CSS. */
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.02, transition: { duration: DURATION.hover, ease: EASE } },
};

/** Icon hover: gentle scale. */
export const iconHover = {
  rest: { scale: 1 },
  hover: { scale: 1.1, transition: { duration: DURATION.hover, ease: EASE } },
};

/** Sidebar item hover (label slide handled in CSS). */
export const sidebarItem = {
  rest: { x: 0 },
  hover: { x: 2, transition: { duration: DURATION.hover, ease: EASE } },
};

/** Avatar hover pop. */
export const avatarHover = {
  rest: { scale: 1 },
  hover: { scale: 1.06, transition: { duration: DURATION.hover, ease: EASE } },
};
