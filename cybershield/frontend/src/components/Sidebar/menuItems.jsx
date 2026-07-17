import {
  Dashboard,
  Security,
  History,
  SmartToy,
  Psychology,
  School,
  Quiz,
  MenuBook,
  Code,
  Lightbulb,
  GppGood,
  EmojiEvents,
  Timeline,
  Person,
  Settings,
  Report,
  LocalFireDepartment,
  AdminPanelSettings,
  People,
  Assessment,
  VerifiedUser
} from "@mui/icons-material";

export const menuItems = [
  {
    title: "Dashboard",
    icon: <Dashboard />,
    path: "/dashboard",
    roles: ["student", "admin"]
  },

  {
    group: "Security",
    roles: ["student", "admin"],
    children: [
      {
        title: "Security Scanner",
        icon: <Security />,
        path: "/security-scanner",
        roles: ["student", "admin"]
      },
      {
        title: "Scan History",
        icon: <History />,
        path: "/scan-history",
        roles: ["student", "admin"]
      },
      {
        title: "Threat Reports",
        icon: <Report />,
        path: "/threat-reports",
        roles: ["student", "admin"]
      },
      {
        title: "Security Checklist",
        icon: <VerifiedUser />,
        path: "/security-checklist",
        roles: ["student", "admin"]
      }
    ]
  },

  {
    group: "AI",
    roles: ["student", "admin"],
    children: [
      {
        title: "AI Assistant",
        icon: <SmartToy />,
        path: "/ai-assistant",
        roles: ["student", "admin"]
      },
      {
        title: "Code Review",
        icon: <Code />,
        path: "/code-review",
        roles: ["student", "admin"]
      },
      {
        title: "AI Recommendations",
        icon: <Lightbulb />,
        path: "/ai-recommendations",
        roles: ["student", "admin"]
      },
      {
        title: "Security Copilot",
        icon: <GppGood />,
        path: "/security-copilot",
        roles: ["student", "admin"]
      },
      {
        title: "AI Checklist",
        icon: <VerifiedUser />,
        path: "/ai-checklist",
        roles: ["student", "admin"]
      },
      {
        title: "Threat Analysis",
        icon: <Psychology />,
        path: "/threat-analysis",
        roles: ["student", "admin"]
      }
    ]
  },

  {
    group: "Learning",
    roles: ["student", "admin"],
    children: [
      {
        title: "OWASP Labs",
        icon: <School />,
        path: "/owasp",
        roles: ["student", "admin"]
      },
      {
        title: "Quiz",
        icon: <Quiz />,
        path: "/quiz",
        roles: ["student", "admin"]
      },
      {
        title: "Glossary",
        icon: <MenuBook />,
        path: "/glossary",
        roles: ["student", "admin"]
      },
      {
        title: "Daily Challenge",
        icon: <LocalFireDepartment />,
        path: "/daily-challenge",
        roles: ["student", "admin"]
      }
    ]
  },

  {
    group: "Progress",
    roles: ["student", "admin"],
    children: [
      {
        title: "Progress",
        icon: <Timeline />,
        path: "/progress",
        roles: ["student", "admin"]
      },
      {
        title: "Achievements",
        icon: <EmojiEvents />,
        path: "/achievements",
        roles: ["student", "admin"]
      }
    ]
  },

  {
    title: "Profile",
    icon: <Person />,
    path: "/profile",
    roles: ["student", "admin"]
  },

  {
    title: "Settings",
    icon: <Settings />,
    path: "/settings",
    roles: ["student", "admin"]
  },

  // Admin-only menu items
  {
    group: "Admin",
    roles: ["admin"],
    children: [
      {
        title: "Admin Panel",
        icon: <AdminPanelSettings />,
        path: "/admin",
        roles: ["admin"]
      },
      {
        title: "Users",
        icon: <People />,
        path: "/admin/users",
        roles: ["admin"]
      },
      {
        title: "Reports",
        icon: <Assessment />,
        path: "/admin/reports",
        roles: ["admin"]
      }
    ]
  }
];