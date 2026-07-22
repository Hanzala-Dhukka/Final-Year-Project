/**
 * CyberShield Navigation Configuration
 * Single source of truth for the sidebar, breadcrumbs, mobile drawer, and search.
 * Icons use the design-system Lucide set (see src/design/icons).
 */
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Shield,
  Scan,
  History,
  Target,
  FileText,
  ListChecks,
  Bot,
  BookOpen,
  HelpCircle,
  Swords,
  Trophy,
  TrendingUp,
  User,
  Settings,
  Bell,
  Sparkles,
  Settings2,
} from "lucide-react";

/**
 * Sections define the grouped sidebar structure.
 * items[].path must match the router (AppRoutes).
 * breadcrumb → label used in auto-generated breadcrumbs.
 */
export const navSections = [
  {
    id: "main",
    label: "Main",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, breadcrumb: "Dashboard" },
      { path: "/projects", label: "Projects", icon: FolderKanban, breadcrumb: "Projects" },
      { path: "/progress", label: "Analytics", icon: BarChart3, breadcrumb: "Analytics" },
    ],
  },
  {
    id: "security",
    label: "Security",
    items: [
      { path: "/security-scanner", label: "GitHub Scanner", icon: Scan, breadcrumb: "GitHub Scanner" },
      { path: "/threat-analysis", label: "Threat Modeling", icon: Target, breadcrumb: "Threat Modeling" },
      { path: "/threat-reports", label: "Threat Reports", icon: FileText, breadcrumb: "Threat Reports" },
      { path: "/security-checklist", label: "Security Checklist", icon: ListChecks, breadcrumb: "Security Checklist" },
      { path: "/compliance", label: "Compliance", icon: Shield, breadcrumb: "Compliance" },
    ],
  },
  {
    id: "learning",
    label: "Learning",
    items: [
      { path: "/ai-assistant", label: "AI Assistant", icon: Bot, breadcrumb: "AI Assistant" },
      { path: "/glossary", label: "Glossary", icon: BookOpen, breadcrumb: "Glossary" },
      { path: "/quiz", label: "Quiz", icon: HelpCircle, breadcrumb: "Quiz" },
      { path: "/owasp", label: "OWASP Simulator", icon: Swords, breadcrumb: "OWASP Simulator" },
      { path: "/achievements", label: "Achievements", icon: Trophy, breadcrumb: "Achievements" },
      { path: "/learning-goals", label: "Progress", icon: TrendingUp, breadcrumb: "Progress" },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { path: "/profile", label: "Profile", icon: User, breadcrumb: "Profile" },
      { path: "/settings", label: "Settings", icon: Settings, breadcrumb: "Settings" },
    ],
  },
];

/** Flat lookup: path -> { label, breadcrumb, icon, section } */
export const navIndex = (() => {
  const map = {};
  navSections.forEach((section) => {
    section.items.forEach((item) => {
      map[item.path] = { ...item, section: section.label };
    });
  });
  return map;
})();

/** Quick actions shown in the navbar dropdown. */
export const quickActions = [
  { id: "project", label: "New Project", icon: FolderKanban, to: "/projects" },
  { id: "scan", label: "Start Scan", icon: Scan, to: "/security-scanner" },
  { id: "report", label: "Generate Threat Report", icon: FileText, to: "/threat-reports" },
  { id: "lab", label: "Launch OWASP Lab", icon: Swords, to: "/owasp" },
  { id: "quiz", label: "Start Quiz", icon: HelpCircle, to: "/quiz" },
];

/** Mock global-search index. Replace with API later. */
export const searchIndex = [
  ...navSections.flatMap((s) => s.items.map((i) => ({ ...i, type: "Page", group: s.label }))),
  { label: "SQL Injection", type: "OWASP Lab", group: "OWASP", to: "/owasp", icon: Swords },
  { label: "XSS Prevention", type: "OWASP Lab", group: "OWASP", to: "/owasp", icon: Swords },
  { label: "Zero Trust", type: "Glossary", group: "Glossary", to: "/glossary", icon: BookOpen },
  { label: "Phishing", type: "Glossary", group: "Glossary", to: "/glossary", icon: BookOpen },
  { label: "Web Security Quiz", type: "Quiz", group: "Quiz", to: "/quiz", icon: HelpCircle },
];

export const APP_VERSION = "v1.0.0";
