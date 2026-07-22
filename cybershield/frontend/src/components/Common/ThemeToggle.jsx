import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import "./ThemeToggle.css";

/**
 * ThemeToggle — one-click animated Dark ⇄ Light switch.
 * Keyboard accessible (real <button>), respects the active theme.
 */
export default function ThemeToggle({ size = 20 }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="cs-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="cs-theme-toggle__icon">
        {isDark ? <Moon size={size} /> : <Sun size={size} />}
      </span>
    </button>
  );
}
