import {
  Dashboard,
  Security,
  History,
  SmartToy,
  Psychology,
  School,
  Quiz,
  MenuBook,
  EmojiEvents,
  Timeline,
  Person,
  Settings,
  Report,
  LocalFireDepartment
} from "@mui/icons-material";

export const menuItems = [
  {
    title: "Dashboard",
    icon: <Dashboard />,
    path: "/dashboard"
  },

  {
    group: "Security",
    children: [
      {
        title: "Security Scanner",
        icon: <Security />,
        path: "/scanner"
      },
      {
        title: "Scan History",
        icon: <History />,
        path: "/scan-history"
      },
      {
        title: "Threat Reports",
        icon: <Report />,
        path: "/threat-reports"
      }
    ]
  },

  {
    group: "AI",
    children: [
      {
        title: "AI Assistant",
        icon: <SmartToy />,
        path: "/ai"
      },
      {
        title: "Threat Analysis",
        icon: <Psychology />,
        path: "/threat-analysis"
      }
    ]
  },

  {
    group: "Learning",
    children: [
      {
        title: "OWASP Labs",
        icon: <School />,
        path: "/owasp"
      },
      {
        title: "Quiz",
        icon: <Quiz />,
        path: "/quiz"
      },
      {
        title: "Glossary",
        icon: <MenuBook />,
        path: "/glossary"
      },
      {
        title: "Daily Challenge",
        icon: <LocalFireDepartment />,
        path: "/daily"
      }
    ]
  },

  {
    group: "Progress",
    children: [
      {
        title: "Progress",
        icon: <Timeline />,
        path: "/progress"
      },
      {
        title: "Achievements",
        icon: <EmojiEvents />,
        path: "/achievements"
      }
    ]
  },

  {
    title: "Profile",
    icon: <Person />,
    path: "/profile"
  },

  {
    title: "Settings",
    icon: <Settings />,
    path: "/settings"
  }
];