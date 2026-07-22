import { useLayout } from "../../context/LayoutContext";
import Sidebar from "../Sidebar/Sidebar";

/**
 * Mobile navigation drawer. Renders the sidebar content in a slide-in overlay.
 * Closes when an item is selected or the overlay is clicked.
 */
export default function MobileDrawer() {
  const { mobileOpen, closeMobile } = useLayout();
  if (!mobileOpen) return null;

  return (
    <div className="cs-sidebar-mobile-overlay" onClick={closeMobile}>
      <div
        className="cs-sidebar-mobile"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Navigation"
      >
        <Sidebar collapsed={false} onNavigate={closeMobile} />
      </div>
    </div>
  );
}
