import { useTheme } from "../../theme/useTheme";
import { Moon, Sun } from "lucide-react";
import LoginIllustration from "./LoginIllustration";

/**
 * AuthLayout — premium split-screen shell for the auth screens.
 * Left: branded illustration (hidden on mobile). Right: children (the card).
 * Dark mode is the default; a theme toggle lives on the page itself.
 */
export default function AuthLayout({ children }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="cs-auth" data-theme-mode={isDark ? "dark" : "light"}>
      {/* Theme toggle — available on the login page per spec */}
      <button
        type="button"
        onClick={toggleTheme}
        className="cs-theme-toggle"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Left branded panel */}
      <aside className="cs-auth-brand">
        <LoginIllustration />
      </aside>

      {/* Right form panel */}
      <main className="cs-auth-form">{children}</main>
    </div>
  );
}
