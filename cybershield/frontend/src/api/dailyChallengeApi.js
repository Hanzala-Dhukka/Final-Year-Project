import API from "./api";

const resolveUserId = () => {
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.id) return parsed.id;
    } catch {
      /* ignore malformed stored user */
    }
  }
  const legacy = localStorage.getItem("user_id");
  return legacy || "anonymous";
};

export const getUserId = resolveUserId;

export const getTodaysChallenge = (userId = resolveUserId()) =>
  API.get("/challenges/today", { params: { user_id: userId } });

export const submitChallenge = (payload) =>
  API.post("/challenges/submit", payload);

export const getChallengeHistory = (userId = resolveUserId(), limit = 30) =>
  API.get("/challenges/history", { params: { user_id: userId, limit } });

export const getUserStreak = (userId = resolveUserId()) =>
  API.get("/challenges/streak", { params: { user_id: userId } });

export const getChallengeStatistics = (userId = resolveUserId()) =>
  API.get("/challenges/statistics", { params: { user_id: userId } });

export const getChallengeCalendar = (userId = resolveUserId()) =>
  API.get("/challenges/calendar", { params: { user_id: userId } });

export const getChallengeLeaderboard = (limit = 10) =>
  API.get("/challenges/leaderboard", { params: { limit } });

export const getChallengeCategories = () =>
  API.get("/challenges/categories");