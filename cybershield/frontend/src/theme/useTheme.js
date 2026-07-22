import { useContext } from "react";
import ThemeContext from "./ThemeContext";

/**
 * Access the active CyberShield theme.
 *
 *   const { mode, isDark, isLight, toggleTheme, setMode, theme } = useTheme();
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return context;
}

export default useTheme;
