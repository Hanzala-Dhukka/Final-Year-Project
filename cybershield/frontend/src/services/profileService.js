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
