/**
 * authService.js
 * Thin wrapper around the FastAPI auth endpoints used by the login experience.
 * Keeping API logic here keeps the Login form presentation-only.
 */
import API from "../api/api";
import { loginUser, logoutUser } from "../api/authApi";

/**
 * Authenticate a user with email + password.
 * @param {{ email: string, password: string, rememberMe?: boolean }} credentials
 * @returns {Promise<{ access_token: string, refresh_token?: string, user?: object }>}
 */
export const login = async ({ email, password, rememberMe = false }) => {
  // Backend expects snake_case fields.
  const response = await loginUser({
    email,
    password,
    remember_me: rememberMe,
  });
  return response;
};

/**
 * Fetch the authenticated user's profile.
 * Returns null when the request fails so callers can decide how to handle it.
 */
export const fetchUserProfile = async () => {
  try {
    const me = await API.get("/auth/me");
    return me.data;
  } catch {
    return null;
  }
};

/**
 * Request a password reset link (used by the Forgot Password flow).
 * Mirrors the backend policy of always returning a generic success message
 * so we never leak whether an email is registered.
 * @param {string} email
 */
export const forgotPassword = async (email) => {
  const response = await API.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * Set a new password using a reset token from the secure email link.
 * Matches the backend: POST /auth/reset-password/{token} with { password }.
 * @param {{ token: string, password: string }} payload
 */
export const resetPassword = async ({ token, password }) => {
  const response = await API.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

/**
 * Register a new user account.
 * @param {{ name: string, email: string, password: string }} data
 */
export const registerUser = async ({ name, email, password }) => {
  const response = await API.post("/auth/register", { name, email, password });
  return response.data;
};

/**
 * Resend the email verification link to an unverified account.
 * Matches POST /api/v1/auth/resend-verification { email }.
 * The backend always returns a generic success message to avoid
 * leaking whether an email is registered.
 * @param {string} email
 */
export const resendVerification = async (email) => {
  const response = await API.post("/auth/resend-verification", { email });
  return response.data;
};

export const authService = {
  login,
  registerUser,
  fetchUserProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
  logoutUser,
};

export default authService;
