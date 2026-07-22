import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useLayout } from "../../context/LayoutContext";
import Breadcrumbs from "../Navigation/Breadcrumbs";
import SearchBar from "../Navigation/SearchBar";
import QuickActions from "../Navigation/QuickActions";
import NotificationBell from "../Navigation/NotificationBell";
import ProfileDropdown from "../Navigation/ProfileDropdown";
import ThemeToggle from "../Common/ThemeToggle";
import "./Navbar.css";

export default function Navbar() {
  const { toggleMobile } = useLayout();

  return (
    <header className="cs-navbar">
      <div className="cs-navbar__left">
        <button
          className="cs-navbar__hamburger"
          onClick={toggleMobile}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <Breadcrumbs />
      </div>

      <div className="cs-navbar__center">
        <SearchBar />
      </div>

      <div className="cs-navbar__right">
        <QuickActions />
        <NotificationBell />
        <ThemeToggle />
        <ProfileDropdown />
      </div>
    </header>
  );
}
