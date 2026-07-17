import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar/Navbar"
import Sidebar from "../components/Sidebar/Sidebar"
import Footer from "../components/Footer/Footer"
import { LayoutProvider } from "../context/LayoutContext"

export default function DashboardLayout() {
  return (
    <LayoutProvider>
      <div className="app-layout">
        <Navbar />

        <div className="main-wrapper">
          <Sidebar />

          <main className="content-area">
            <Outlet />
          </main>
        </div>

        <Footer />
      </div>
    </LayoutProvider>
  )
}