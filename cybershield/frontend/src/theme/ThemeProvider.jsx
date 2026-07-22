import { useEffect, useMemo, useState, useCallback } from "react";
import ThemeContext from "./ThemeContext";
import { themes } from "./themes";

const STORAGE_KEY = "cybershield-theme";

/**
 * Resolve the initial mode:
 *   1. Saved preference in localStorage (highest priority)
 *   2. OS color-scheme preference (first visit)
 *   3. Default: dark
 */
function getInitialMode() {
  if (typeof window === "undefined") return "dark";

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? "dark" : "light";
}

/** Write every theme token as a CSS custom property on <html>. */
function applyThemeVariables(mode) {
  const theme = themes[mode];
  const root = document.documentElement;

  Object.entries(theme).forEach(([key, value]) => {
    if (key === "name" || key === "label") return;
    root.style.setProperty(`--${key}`, value);
  });

  // Drive Tailwind / plain CSS consumers and the MUI mode downstream.
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getInitialMode);

  // Apply variables whenever mode changes (also runs on first mount → no flash).
  useEffect(() => {
    applyThemeVariables(mode);
  }, [mode]);

  // Follow OS changes only while the user hasn't explicitly chosen a theme.
  useEffect(() => {
    if (!window.matchMedia) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setModeState(e.matches ? "dark" : "light");
      }
    };

    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const setMode = useCallback((next) => {
    const resolved = next === "dark" || next === "light" ? next : "dark";
    localStorage.setItem(STORAGE_KEY, resolved);
    setModeState(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme: themes[mode],
      mode,
      isDark: mode === "dark",
      isLight: mode === "light",
      setMode,
      toggleTheme,
    }),
    [mode, setMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export default ThemeProvider;
