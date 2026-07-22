import API from "./api";

// Glossary API (Module 7.3) — mounted under /api/v1/glossary
export const glossaryApi = {
  list: (params = {}) => API.get("/glossary", { params }),
  search: (q, category) =>
    API.get("/glossary/search", { params: { q, category } }),
  categories: () => API.get("/glossary/categories"),
  byCategory: (category) => API.get(`/glossary/category/${encodeURIComponent(category)}`),
  getTerm: (id) => API.get(`/glossary/${id}`),
  related: (id) => API.get(`/glossary/${id}/related`),
  quiz: (id) => API.get(`/glossary/${id}/quiz`),
  explain: (term, definition) =>
    API.post("/glossary/explain", { term, definition }),
  exportPdf: (id) =>
    API.get(`/glossary/export/${id}`, { responseType: "blob" }),
  suggest: (payload) => API.post("/glossary/suggest", payload),
  toggleFavorite: (id) => API.post(`/glossary/${id}/favorite`),
  favorites: () => API.get("/glossary/favorites/me"),
  progress: () => API.get("/glossary/progress/me"),
  markLearned: (termId) => API.post("/glossary/progress/learned", { term_id: termId }),
  createFlashcards: (payload = {}) => API.post("/glossary/flashcards", payload),
  flashcardResult: (payload) => API.post("/glossary/flashcards/result", payload),
};

// Spec Step 4 categories
export const GLOSSARY_CATEGORIES = [
  "OWASP Top 10",
  "Authentication",
  "Authorization",
  "Networking",
  "Cryptography",
  "Cloud Security",
  "API Security",
  "DevSecOps",
  "Docker",
  "Kubernetes",
  "React",
  "FastAPI",
  "MongoDB",
  "Git",
  "Linux",
  "Malware",
  "Threat Modeling",
  "Compliance",
  "Identity Management",
  "Web Security",
];

export default glossaryApi;
