import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import Register from "../pages/Register"

function Home() {
  return <h1>Home Page</h1>
}

function Login() {
  return <h1>Login Page</h1>
}

function Dashboard() {
  return <h1>Dashboard</h1>
}

function AppRouter() {

  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>

    </BrowserRouter>
  )
}

export default AppRouter