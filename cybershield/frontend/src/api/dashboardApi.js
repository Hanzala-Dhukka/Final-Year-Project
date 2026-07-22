import axios from "axios";

const API_BASE = "http://localhost:8000";
const API_URL = `${API_BASE}/api`;

// ── Auth header helper ────────────────────────────────────────────────────────
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Dashboard overview ────────────────────────────────────────────────────────

export const getDashboardData = async () => {
  const config = { headers: authHeader() };
  try {
    const res = await axios.get(`${API_URL}/v1/dashboard/overview`, config);
    return res.data;
  } catch {
    try {
      const res = await axios.get(`${API_URL}/dashboard/overview`, config);
      return res.data;
    } catch {
      const res = await axios.get(`${API_BASE}/dashboard/overview`, config);
      return res.data;
    }
  }
};

export const getDashboardOverview = getDashboardData;

// ── Dashboard preferences ─────────────────────────────────────────────────────

/**
 * Fetch the current user's saved dashboard preferences (layout, hidden widgets,
 * favorites, filters).  Returns a default preferences object on failure so the
 * UI always has something to work with.
 */
export const getDashboardPreferences = async () => {
  const config = { headers: authHeader() };
  try {
    const res = await axios.get(`${API_URL}/v1/dashboard/preferences`, config);
    return res.data;
  } catch {
    try {
      const res = await axios.get(`${API_URL}/dashboard/preferences`, config);
      return res.data;
    } catch {
      // Return sensible defaults so the UI still works offline
      return {
        layout: [],
        hidden_widgets: [],
        favorite_widgets: ["security", "vulnerability", "activity"],
        filters: { project: "All", severity: "All", date: "7 Days" },
      };
    }
  }
};

/**
 * Persist a partial or full preferences payload.
 * @param {Object} data  Any subset of: { layout, hidden_widgets, favorite_widgets, filters }
 */
export const saveDashboardPreferences = async (data) => {
  const config = { headers: authHeader() };
  try {
    const res = await axios.post(`${API_URL}/v1/dashboard/preferences`, data, config);
    return res.data;
  } catch {
    try {
      const res = await axios.post(`${API_URL}/dashboard/preferences`, data, config);
      return res.data;
    } catch (err) {
      console.warn("Failed to save dashboard preferences:", err);
      return null;
    }
  }
};

/**
 * Delete saved preferences for the current user, restoring backend defaults.
 */
export const resetDashboardPreferences = async () => {
  const config = { headers: authHeader() };
  try {
    const res = await axios.delete(`${API_URL}/v1/dashboard/preferences`, config);
    return res.data;
  } catch {
    try {
      const res = await axios.delete(`${API_URL}/dashboard/preferences`, config);
      return res.data;
    } catch (err) {
      console.warn("Failed to reset dashboard preferences:", err);
      return null;
    }
  }
};
