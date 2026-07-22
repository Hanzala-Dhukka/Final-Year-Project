/**
 * onboardingService.js
 * Thin wrappers around the FastAPI onboarding endpoints.
 * Base URL is http://localhost:8000/api/v1 (see src/api/api.js).
 */
import API from "../api/api";

/**
 * Fetch the current user's onboarding status.
 * GET /api/v1/onboarding/status
 */
export const getOnboardingStatus = async () => {
  const response = await API.get("/onboarding/status");
  return response.data;
};

/**
 * Save onboarding preferences and mark onboarding complete.
 * POST /api/v1/onboarding/complete
 * @param {{ name?: string, avatar?: string, bio?: string, skill_level: string, learning_goals: string[] }} data
 */
export const completeOnboarding = async (data) => {
  const response = await API.post("/onboarding/complete", data);
  return response.data;
};

/**
 * Skip onboarding entirely (user opts out).
 * POST /api/v1/onboarding/skip
 */
export const skipOnboarding = async () => {
  const response = await API.post("/onboarding/skip");
  return response.data;
};

export const onboardingService = {
  getOnboardingStatus,
  completeOnboarding,
  skipOnboarding,
};

export default onboardingService;
