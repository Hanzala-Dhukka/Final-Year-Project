// Local mirror of the backend achievement catalog (Module 3.3 — Step 3).
// The backend /achievements/{id} endpoint returns a list of unlocked badge
// keys; this catalog provides display metadata for both locked & unlocked.
import {
  EmojiEvents,
  BugReport,
  Shield,
  FlashOn,
  Explore,
  VerifiedUser,
  SmartToy,
  Quiz,
  WorkspacePremium,
  MilitaryTech,
  Security,
} from "@mui/icons-material";

export const ACHIEVEMENTS = [
  { key: "first_blood", name: "First Blood", description: "Complete your first lab", xp: 50, icon: BugReport },
  { key: "sql_hunter", name: "SQL Hunter", description: "Complete all SQL injection labs", xp: 250, icon: BugReport },
  { key: "xss_defender", name: "XSS Defender", description: "Complete all XSS defense labs", xp: 250, icon: Shield },
  { key: "injection_master", name: "Injection Master", description: "Complete all injection modules", xp: 500, icon: FlashOn },
  { key: "daily_warrior", name: "Daily Warrior", description: "7-day login streak", xp: 100, icon: FlashOn },
  { key: "cyber_explorer", name: "Cyber Explorer", description: "Complete 20 labs", xp: 300, icon: Explore },
  { key: "perfect_defender", name: "Perfect Defender", description: "100% on 10 labs", xp: 500, icon: VerifiedUser },
  { key: "ai_learner", name: "AI Learner", description: "Use AI tutor 20 times", xp: 200, icon: SmartToy },
  { key: "quiz_champion", name: "Quiz Champion", description: "Score 100% on 10 quizzes", xp: 300, icon: Quiz },
  { key: "security_professional", name: "Security Professional", description: "Reach Expert skill level", xp: 1000, icon: WorkspacePremium },
  { key: "cybershield_master", name: "CyberShield Master", description: "Reach the highest level", xp: 1000, icon: MilitaryTech },
  { key: "first_scan", name: "First Scan", description: "Scan your first repository", xp: 50, icon: Security },
  { key: "threat_hunter", name: "Threat Hunter", description: "Generate 10 threat reports", xp: 100, icon: Security },
  { key: "welcome", name: "Welcome", description: "Register your account", xp: 20, icon: EmojiEvents },
  { key: "complete_profile", name: "Complete Profile", description: "Fill in your profile", xp: 20, icon: VerifiedUser },
];

export function getAchievement(key) {
  return ACHIEVEMENTS.find((a) => a.key === key);
}

export function buildAchievementList(unlockedKeys = []) {
  const set = new Set(unlockedKeys);
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: set.has(a.key) }));
}
