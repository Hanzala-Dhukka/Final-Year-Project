import API from "./api";

// AI Code Review API (Module 5.3)
// All endpoints are mounted under /api/v1/code-review

export const codeReviewApi = {
  // Review pasted code
  reviewCode: (code, language = null, project_id = null) =>
    API.post("/code-review", { code, language, project_id }),

  // Review an uploaded file
  reviewFile: (file, language = null) => {
    const form = new FormData();
    form.append("file", file);
    if (language) form.append("language", language);
    return API.post("/code-review/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // List past reviews
  getHistory: () => API.get("/code-review/history"),

  // Get a full report
  getReport: (review_id) => API.get(`/code-review/${review_id}`),

  // Delete a review
  deleteReview: (review_id) => API.delete(`/code-review/${review_id}`),

  // Export a report (json | markdown | pdf)
  exportReview: (review_id, format = "json") =>
    API.get(`/code-review/${review_id}/export?format=${format}`, {
      responseType: format === "json" ? "json" : "blob",
    }),
};

export default codeReviewApi;
