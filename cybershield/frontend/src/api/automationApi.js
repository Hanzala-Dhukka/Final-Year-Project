import API from "./api";

// Module 6.5 — Automation, Scheduler, Notifications & Activity Feed.

// ── Notifications ──────────────────────────────────────────────────────────
export const getNotificationsSummary = () => API.get("/notifications/summary");
export const getNotifications = () => API.get("/notifications");
export const getUnreadCount = () => API.get("/notifications/unread-count");
export const markNotificationRead = (id) =>
  API.patch(`/notifications/${id}/read`);
export const markAllRead = () => API.patch("/notifications/read-all");
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// ── Scheduled scans ──────────────────────────────────────────────────────────
export const createSchedule = (payload) =>
  API.post("/automation/scheduler/create", payload);
export const listSchedules = () => API.get("/automation/scheduler");
export const updateSchedule = (id, payload) =>
  API.put(`/automation/scheduler/${id}`, payload);
export const deleteSchedule = (id) => API.delete(`/automation/scheduler/${id}`);
export const runScanNow = (projectId, repoUrl) =>
  API.post(`/automation/scheduler/run/${projectId}`, { repo_url: repoUrl });

// ── Automation rules ────────────────────────────────────────────────────────
export const createRule = (payload) => API.post("/automation/rules", payload);
export const listRules = () => API.get("/automation/rules");
export const updateRule = (id, payload) => API.put(`/automation/rules/${id}`, payload);
export const deleteRule = (id) => API.delete(`/automation/rules/${id}`);

// ── Activity feed ────────────────────────────────────────────────────────────
export const getActivityFeed = (projectId) =>
  API.get("/automation/activity", { params: projectId ? { project_id: projectId } : {} });
export const getProjectActivity = (projectId) =>
  API.get(`/automation/activity/${projectId}`);

const automationApi = {
  getNotificationsSummary,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  createSchedule,
  listSchedules,
  updateSchedule,
  deleteSchedule,
  runScanNow,
  createRule,
  listRules,
  updateRule,
  deleteRule,
  getActivityFeed,
  getProjectActivity,
};

export default automationApi;
