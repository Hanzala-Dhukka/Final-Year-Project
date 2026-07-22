import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { useOnClickOutside } from "../ui/hooks";
import { quickActions } from "./navConfig";

/** Quick actions popover launched from the navbar. */
export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div className="cs-quick" ref={ref}>
      <button
        className="cs-quick__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Quick actions"
      >
        <Plus size={18} />
      </button>
      {open && (
        <div className="cs-quick__menu" role="menu">
          <div className="cs-quick__head">
            <Sparkles size={14} /> Quick Actions
          </div>
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                className="cs-quick__item"
                onClick={() => {
                  navigate(a.to);
                  setOpen(false);
                }}
              >
                <span className="cs-quick__icon">
                  <Icon size={16} />
                </span>
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
