import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Trophy, Award, Settings, LogOut, ChevronDown } from "lucide-react";
import { useOnClickOutside } from "../ui/hooks";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../ui/Avatar";

/** User profile dropdown with avatar, level, and account links. */
export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  useOnClickOutside(ref, () => setOpen(false));

  const name = user?.full_name || user?.username || "User";
  const email = user?.email || "user@cybershield.io";
  const level = user?.level || 7;

  const links = [
    { label: "Profile", icon: User, to: "/profile" },
    { label: "Achievements", icon: Trophy, to: "/achievements" },
    { label: "Certificates", icon: Award, to: "/achievements" },
    { label: "Settings", icon: Settings, to: "/settings" },
  ];

  const go = (to) => {
    navigate(to);
    setOpen(false);
  };

  return (
    <div className="cs-profile" ref={ref}>
      <button
        className="cs-profile__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} src={user?.profile_image} size="sm" status="online" />
        <ChevronDown size={16} className={`cs-profile__chev ${open ? "rotate" : ""}`} />
      </button>
      {open && (
        <div className="cs-profile__menu" role="menu">
          <div className="cs-profile__card">
            <Avatar name={name} src={user?.profile_image} size="lg" />
            <div className="cs-profile__info">
              <div className="cs-profile__name">{name}</div>
              <div className="cs-profile__email">{email}</div>
              <div className="cs-profile__level">Level {level}</div>
            </div>
          </div>
          <div className="cs-profile__links">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <button key={l.label} className="cs-profile__link" onClick={() => go(l.to)}>
                  <Icon size={16} /> {l.label}
                </button>
              );
            })}
          </div>
          <button
            className="cs-profile__logout"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
