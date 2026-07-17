import { useMediaQuery, useTheme } from "@mui/material";

export const useResponsive = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 768px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg")); // 768px - 1199px
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg")); // >= 1200px

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
};
