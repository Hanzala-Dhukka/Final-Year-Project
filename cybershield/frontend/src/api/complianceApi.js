import API from "./api";

// Compliance Center (Module 6.3)
export const complianceApi = {
  // List projects available to the current user.
  listProjects: () => API.get("/compliance/projects"),

  // Generate (and persist) a compliance report for a project.
  generate: (projectId) =>
    API.post("/compliance/generate", { project_id: projectId }),

  // Fetch the latest report + history for a project.
  get: (projectId) => API.get(`/compliance/${projectId}`),

  // Export endpoints (return blob downloads).
  exportPdf: (projectId) =>
    API.get(`/compliance/export/pdf/${projectId}`, { responseType: "blob" }),

  exportJson: (projectId) =>
    API.get(`/compliance/export/json/${projectId}`, { responseType: "blob" }),
};

// Trigger a browser download from a blob response.
export function downloadBlob(response, fallbackName) {
  const contentDisposition = response.headers["content-disposition"] || "";
  let filename = fallbackName;
  const match = contentDisposition.match(/filename="?([^";]+)"?/);
  if (match) filename = match[1];
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default complianceApi;
