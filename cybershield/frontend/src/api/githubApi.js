import API from "./api";

export const validateRepository = async (repository) => {
  const response = await API.post("/github/validate", { repository });
  return response.data;
};

export const analyzeRepository = async (repository) => {
  const response = await API.post("/github/analyze", { repository });
  return response.data;
};

export const getAnalysisHistory = async () => {
  const response = await API.get("/github/analysis/history");
  return response.data;
};

export const getAnalysisById = async (analysisId) => {
  const response = await API.get(`/github/analysis/${analysisId}`);
  return response.data;
};
