import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
  CommandSeparator,
} from "cmdk";
import "./CommandPalette.css";

const NAV_COMMANDS = [
  { id: "dashboard",    label: "Dashboard",          icon: "📊", shortcut: "1", path: "/dashboard" },
  { id: "scanner",      label: "Security Scanner",   icon: "🔍", shortcut: "2", path: "/security-scanner" },
  { id: "quiz",         label: "Quiz",               icon: "🧠", shortcut: "3", path: "/quiz" },
  { id: "threat-model", label: "Threat Analysis",    icon: "🛡️", shortcut: "4", path: "/threat-analysis" },
  { id: "reports",      label: "Threat Reports",     icon: "📋", shortcut: "5", path: "/threat-reports" },
  { id: "owasp",        label: "OWASP Labs",         icon: "⚠️", shortcut: "6", path: "/owasp" },
  { id: "profile",      label: "Profile",            icon: "👤", shortcut: "7", path: "/profile" },
  { id: "settings",     label: "Settings",           icon: "⚙️", shortcut: ",", path: "/settings" },
  { id: "progress",     label: "Learning Progress",  icon: "📈", shortcut: "",  path: "/progress" },
  { id: "achievements", label: "Achievements",       icon: "🏆", shortcut: "",  path: "/achievements" },
  { id: "copilot",      label: "Security Copilot",   icon: "🤖", shortcut: "",  path: "/security-copilot" },
  { id: "code-review",  label: "Code Review",        icon: "💻", shortcut: "",  path: "/code-review" },
  { id: "compliance",   label: "Compliance Center",  icon: "✅", shortcut: "",  path: "/compliance" },
];

const ACTION_COMMANDS = [
  { id: "refresh",  label: "Refresh Dashboard", icon: "↻",  shortcut: "R",  action: "refresh" },
  { id: "new-scan", label: "New Scan",           icon: "➕", shortcut: "N",  action: "navigate", path: "/security-scanner" },
  { id: "quiz-start", label: "Start Quiz",       icon: "🚀", shortcut: "↵", action: "navigate", path: "/quiz" },
];

export default function CommandPalette({ isOpen, onClose, onRefresh }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const overlayRef = useRef(null);

  // Reset search each time the palette opens
  useEffect(() => {
    if (isOpen) setSearch("");
  }, [isOpen]);

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose?.();
      }
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  const handleAction = (cmd) => {
    if (cmd.action === "refresh") {
      onRefresh?.();
      onClose?.();
    } else if (cmd.action === "navigate") {
      handleNav(cmd.path);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="command-palette-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="command-palette-wrapper">
        <Command className="command-palette" shouldFilter loop>
          <div className="command-palette-header">
            <span className="command-palette-icon">⌨️</span>
            <CommandInput
              className="command-palette-input"
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
            <kbd className="command-esc-hint">ESC</kbd>
          </div>

          <CommandList className="command-palette-list">
            <CommandEmpty className="command-empty">
              No results for &ldquo;{search}&rdquo;
            </CommandEmpty>

            <CommandGroup heading="Navigation" className="command-group">
              {NAV_COMMANDS.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={cmd.label}
                  onSelect={() => handleNav(cmd.path)}
                  className="command-item"
                >
                  <span className="command-icon" aria-hidden="true">{cmd.icon}</span>
                  <span className="command-label">{cmd.label}</span>
                  {cmd.shortcut && (
                    <span className="command-shortcut" aria-label={`Shortcut Ctrl ${cmd.shortcut}`}>
                      <kbd>⌘</kbd><kbd>{cmd.shortcut}</kbd>
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="command-separator" />

            <CommandGroup heading="Actions" className="command-group">
              {ACTION_COMMANDS.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={cmd.label}
                  onSelect={() => handleAction(cmd)}
                  className="command-item"
                >
                  <span className="command-icon" aria-hidden="true">{cmd.icon}</span>
                  <span className="command-label">{cmd.label}</span>
                  {cmd.shortcut && (
                    <span className="command-shortcut">
                      <kbd>⌘</kbd><kbd>{cmd.shortcut}</kbd>
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          <div className="command-palette-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>ESC</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
