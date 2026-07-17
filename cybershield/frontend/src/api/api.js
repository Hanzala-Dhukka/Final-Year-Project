import axios from "axios";

// Create axios instance
const API = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Create separate admin API instance for admin routes (which use /api/admin prefix)
const ADMIN_API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

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

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          // Try to refresh the access token
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
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear tokens and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
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