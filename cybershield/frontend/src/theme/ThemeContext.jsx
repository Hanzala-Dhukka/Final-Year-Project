import { createContext } from "react";

/**
 * Theme Context
 * Provides: theme (object), mode ("dark" | "light"), setMode(), toggleTheme(),
 * isDark, isLight. Consume via the useTheme() hook.
 */
const ThemeContext = createContext({
  theme: null,
  mode: "dark",
  isDark: true,
  isLight: false,
  setMode: () => {},
  toggleTheme: () => {},
});

export default ThemeContext;
