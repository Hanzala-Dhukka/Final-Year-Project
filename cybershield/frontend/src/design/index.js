/**
 * CyberShield Design System — Single Source of Truth
 *
 * Import everything from here:
 *   import { colors, typography, spacing, radius, shadows, gradients, animations, icons, iconSize, components } from "@/design";
 *
 * No component should hard-code colors, spacing, radii, shadows, or fonts.
 * Pull every value from this module so the system stays consistent.
 */

import colors from "./colors";
import typography from "./typography";
import spacing, { spacingScale } from "./spacing";
import radius, { defaultRadius } from "./radius";
import shadows from "./shadows";
import gradients from "./gradients";
import animations from "./animations";
import icons, { iconSize } from "./icons";
import components from "./components";

const design = {
  colors,
  typography,
  spacing,
  spacingScale,
  radius,
  defaultRadius,
  shadows,
  gradients,
  animations,
  icons,
  iconSize,
  components,
};

export {
  colors,
  typography,
  spacing,
  spacingScale,
  radius,
  defaultRadius,
  shadows,
  gradients,
  animations,
  icons,
  iconSize,
  components,
};

export default design;
