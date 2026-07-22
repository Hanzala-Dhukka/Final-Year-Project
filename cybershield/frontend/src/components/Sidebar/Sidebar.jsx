import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Shield, Zap } from "lucide-react";
import { navSections, APP_VERSION } from "../Navigation/navConfig";
import { useLayout } from "../../context/LayoutContext";
import "./Sidebar.css";

/** Inner sidebar markup — reused by the desktop shell and the mobile drawer. */
export function SidebarContent({ collapsed, onNavigate }) {
  const { pathname } = useLocation();

  return (
    <div className={`cs-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="cs-sidebar__brand">
        <div className="cs-sidebar__logo">
          <Shield size={22} />
        </div>
        {!collapsed && (
          <motion.span
            className="cs-sidebar__name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            CyberShield
          </motion.span>
        )}
      </div>

      <nav className="cs-sidebar__nav">
        {navSections.map((section) => (
          <div className="cs-sidebar__group" key={section.id}>
            {!collapsed && (
              <div className="cs-sidebar__group-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`cs-sidebar__item ${active ? "is-active" : ""}`}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                >
                  <span className="cs-sidebar__item-icon">
                    <Icon size={20} />
                  </span>
                  {!collapsed && <span className="cs-sidebar__item-label">{item.label}</span>}
                  {active && (
                    <motion.span
                      layoutId="cs-sidebar-active"
                      className="cs-sidebar__active-bar"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="cs-sidebar__footer">
        <div className="cs-sidebar__version">
          {!collapsed ? (
            <>
              <Zap size={14} /> CyberShield {APP_VERSION}
            </>
          ) : (
            <Zap size={16} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Desktop/tablet permanent sidebar with collapse control. */
export default function Sidebar() {
  const { collapsed, toggleSidebar } = useLayout();

  return (
    <aside className={`cs-sidebar-shell ${collapsed ? "is-collapsed" : ""}`}>
      <SidebarContent collapsed={collapsed} />
      <button
        className="cs-sidebar__collapse"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft size={18} className={collapsed ? "rotate-180" : ""} />
      </button>
    </aside>
  );
}
