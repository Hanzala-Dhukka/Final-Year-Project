import { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  const loginWithTokens = async ({ access_token, refresh_token = null }) => {
    // Persist the token FIRST so the /auth/me call below is authenticated
    // (the axios request interceptor reads the token from localStorage).
    localStorage.setItem("token", access_token);
    if (refresh_token) {
      localStorage.setItem("refresh_token", refresh_token);
    }

    // The auth API returns tokens but no user profile; fetch it now.
    let user = null;
    try {
      const me = await API.get("/auth/me");
      user = me.data;
    } catch (e) {
      user = null;
    }

    localStorage.setItem("user", JSON.stringify(user));

    // Update state
    setToken(access_token);
    setRefreshToken(refresh_token || null);
    setUser(user);
    setIsAuthenticated(true);

    return { access_token, refresh_token, user };
  };

  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      await loginWithTokens(response);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Re-fetch the current user profile (e.g. after email verification) and
  // sync both state and localStorage so verification banners disappear.
  const refreshUser = useCallback(async () => {
    try {
      const me = await API.get("/auth/me");
      setUser(me.data);
      localStorage.setItem("user", JSON.stringify(me.data));
      return me.data;
    } catch (error) {
      return null;
    }
  }, []);

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
        loginWithTokens,
        logout,
        logoutAll,
        setUser,
        refreshUser,
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
