import API from "../api/api";

export const getProfile = async () => {
  const response = await API.get("/users/profile");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await API.put("/users/profile", profileData);
  return response.data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await API.post("/users/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteAvatar = async () => {
  const response = await API.delete("/users/avatar");
  return response.data;
};

// ── Rich profile (statistics, settings, security score, activity) ──────────

export const getRichProfile = async () => {
  const response = await API.get("/profile");
  return response.data;
};

export const getProfileSettings = async () => {
  const response = await API.get("/profile/settings");
  return response.data;
};

export const updateUserSettings = async (settingsData) => {
  const response = await API.put("/profile/settings", settingsData);
  return response.data;
};

export const getLoginActivity = async () => {
  const response = await API.get("/profile/activity");
  return response.data;
};

export const getSecurityScore = async () => {
  const response = await API.get("/profile/security-score");
  return response.data;
};

export const recalculateSecurityScore = async () => {
  const response = await API.post("/profile/security-score/calculate");
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await API.post("/profile/change-password", payload);
  return response.data;
};
