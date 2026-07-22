import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { LayoutProvider } from "../context/LayoutContext";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import MobileDrawer from "../components/Navigation/MobileDrawer";
import AnimatedPage from "../components/Animation/AnimatedPage";
import "../components/Navigation/navigation.css";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <LayoutProvider>
      <div className="cs-layout">
        <Sidebar />
        <MobileDrawer />
        <div className="cs-layout__main">
          <Navbar />
          <main className="cs-layout__content">
            <AnimatePresence mode="wait">
              <AnimatedPage key={location.pathname}>
                <Outlet />
              </AnimatedPage>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
