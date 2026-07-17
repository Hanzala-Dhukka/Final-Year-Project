import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, logoutUser } from "../api/authApi";
import API from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Validate session by calling /auth/me
  const validateSession = async (storedToken) => {
    try {
      const response = await API.get("/auth/me");
      setUser(response.data);
      setToken(storedToken);
      setRefreshToken(localStorage.getItem("refresh_token"));
      setIsAuthenticated(true);
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Auto-login on app start
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      // Validate token with backend
      validateSession(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);

      // The auth API returns tokens but no user object, so fetch the profile.
      let user = null;
      try {
        const me = await API.get("/auth/me");
        user = me.data;
      } catch (e) {
        user = null;
      }

      // Store in localStorage
      localStorage.setItem("token", response.access_token);
      localStorage.setItem("user", JSON.stringify(user));
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }

      // Update state
      setToken(response.access_token);
      setRefreshToken(response.refresh_token || null);
      setUser(user);
      setIsAuthenticated(true);

      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await API.post("/auth/logout");
    } catch (error) {
      // Ignore logout errors, just clear local state
    } finally {
      logoutUser();
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const logoutAll = async () => {
    try {
      // Call backend logout-all endpoint
      await API.post("/auth/logout-all");
    } catch (error) {
      // Ignore logout errors, just clear local state
    } finally {
      logoutUser();
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated,
        loading,
        login,
        logout,
        logoutAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
