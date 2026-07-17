import API from "./api";

// AI-powered dynamic security checklist API (Module 6.2)
export const aiChecklistApi = {
  // POST /api/v1/ai/checklist/generate  { project_id }
  generate: (projectId) =>
    API.post("/ai/checklist/generate", { project_id: projectId }),

  // GET /api/v1/ai/checklist/{project_id}
  getLatest: (projectId) =>
    API.get(`/ai/checklist/${projectId}`),

  // POST /api/v1/ai/checklist/regenerate { project_id }
  regenerate: (projectId) =>
    API.post("/ai/checklist/regenerate", { project_id: projectId }),

  // DELETE /api/v1/ai/checklist/{id}
  remove: (id) => API.delete(`/ai/checklist/${id}`),

  // PUT /api/v1/ai/checklist/{id}/items/{index}/complete?completed=
  markItem: (id, index, completed) =>
    API.put(`/ai/checklist/${id}/items/${index}/complete`, null, {
      params: { completed },
    }),
};

export default aiChecklistApi;
