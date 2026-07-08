import axios from "axios";

// Create axios instance
const API = axios.create({
  baseURL: "http://localhost:8000/api/v1",
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

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(error);
        }
        
        // Try to refresh the access token
        const response = await axios.post(
          "http://localhost:8000/api/v1/auth/refresh",
          { refresh_token: refreshToken }
        );
        
        const { access_token, refresh_token: new_refresh_token } = response.data;
        
        // Save new tokens
        localStorage.setItem("token", access_token);
        if (new_refresh_token) {
          localStorage.setItem("refresh_token", new_refresh_token);
        }
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        return API(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;