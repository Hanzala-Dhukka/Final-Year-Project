import { useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import createCyberShieldTheme from "../styles/theme";
import { useTheme } from "./useTheme";

/**
 * Keeps the MUI theme in sync with the CyberShield global theme mode.
 * Rebuilds the MUI theme only when `mode` changes (no unnecessary re-renders).
 */
export default function MuiThemeBridge({ children }) {
  const { mode } = useTheme();
  const muiTheme = useMemo(() => createCyberShieldTheme(mode), [mode]);

  return <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>;
}
