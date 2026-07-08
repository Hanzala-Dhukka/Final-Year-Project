import { Navigate } from "react-router-dom"

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  const userData = localStorage.getItem("user")

  if (!token) {
    return <Navigate to="/login" />
  }

  // Check if user has admin role
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user.role !== "admin") {
        return <Navigate to="/dashboard" />
      }
    } catch (error) {
      return <Navigate to="/login" />
    }
  }

  return children
}

export default AdminProtectedRoute