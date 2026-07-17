import API from "../api/api";

// Achievements / XP / Progress API (Module 3.3 — Step 17).
// Backend progress_routes is registered under prefix "/api/v1" and exposes
// /dashboard/{user_id} (xp, level, skill, badges) and /achievements/{user_id}.
// There is no /progress/{user_id} route, so getProgress maps to the dashboard endpoint.
export const getProgress = (userId) => API.get(`/dashboard/${userId}`);
export const getAchievements = (userId) => API.get(`/achievements/${userId}`);
export const getActivity = (userId) => API.get(`/activity/${userId}`);

export default { getProgress, getAchievements, getActivity };
