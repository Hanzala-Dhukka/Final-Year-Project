import axios from "axios";

// Create axios instance
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export { API_BASE_URL };

// Create axios instance
const API = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create separate admin API instance for admin APIs (which use /api/admin prefix)
const ADMIN_API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Clear stored credentials and send the user to /login — but never force a
 * full reload when already on an auth page, otherwise the inline error
 * messages on the login/register forms get wiped out immediately.
 */
function clearSessionAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");

  const authPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/resend-verification",
  ];
  if (!authPages.includes(window.location.pathname)) {
    window.location.href = "/login";
  }
}

// Attach the same auth + refresh handling to the admin instance so every
// /api/admin/* request carries the Bearer token (the backend admin_required
// dependency rejects requests without one).
ADMIN_API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { refreshToken: localStorage.getItem("refresh_token") };
    return config;
  },
  (error) => Promise.reject(error)
);

ADMIN_API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const response = await API.post("/auth/refresh", {
            refresh_token: refreshToken,
          });
          const { access_token } = response.data;
          localStorage.setItem("token", access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return ADMIN_API(originalRequest);
        } catch (refreshError) {
          clearSessionAndRedirect();
        }
      } else {
        clearSessionAndRedirect();
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Store refresh token in config for later use
    config.metadata = { refreshToken };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and refresh token
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // A 401 from /auth/login simply means bad credentials. Surface the
      // backend's message to the form instead of treating it as an expired
      // session (which would redirect/reload and wipe the error message).
      if ((originalRequest.url || "").includes("/auth/login")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          // Try to refresh the access token
          // Backend route is /auth/refresh (mounted router exposes /refresh)
          const response = await API.post("/auth/refresh", {
            refresh_token: refreshToken
          });

          const { access_token } = response.data;

          // Save new access token
          localStorage.setItem("token", access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          return API(originalRequest);
        } catch (refreshError) {
          // Refresh failed — clear tokens and redirect to login (safe path)
          clearSessionAndRedirect();
        }
      } else {
        // No refresh token — clear tokens and redirect to login (safe path)
        clearSessionAndRedirect();
      }
    }

    return Promise.reject(error);
  }
);

// =====================
// ADMIN APIs
// =====================

export const adminGetDashboard = () => ADMIN_API.get("/admin/dashboard");

export const adminGetAllUsers = (skip = 0, limit = 100) =>
  ADMIN_API.get(`/admin/users?skip=${skip}&limit=${limit}`);

export const adminSearchUsers = (query) =>
  ADMIN_API.get(`/admin/users/search?query=${encodeURIComponent(query)}`);

export const adminChangeUserRole = (userId, role) =>
  ADMIN_API.put(`/admin/users/${userId}/role`, { role });

export const adminChangeUserStatus = (userId, status) =>
  ADMIN_API.put(`/admin/users/${userId}/status`, { status });

export const adminDeleteUser = (userId) =>
  ADMIN_API.delete(`/admin/users/${userId}`);

export const adminGetUserActivity = (userId) =>
  ADMIN_API.get(`/admin/users/${userId}/activity`);

export const adminGetStatistics = () => ADMIN_API.get("/admin/statistics");

export const adminGetSecurityMonitoring = () =>
  ADMIN_API.get("/admin/security-monitoring");

export const adminGetRecentActivities = (limit = 50) =>
  ADMIN_API.get(`/admin/activities?limit=${limit}`);

export default API;