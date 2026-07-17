import API from "../api/api";

// Dashboard API (Module 3.2 — Step 15).
// The backend aggregates all dashboard data behind a single call:
//   GET /dashboard/{user_id}
export const getDashboard = (userId) => API.get(`/dashboard/${userId}`);

export default { getDashboard };
