import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import { menuItems } from "./menuItems";
import { useLayout } from "../../context/LayoutContext";
import { useResponsive } from "../../hooks/useResponsive";
import { useAuth } from "../../contexts/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const { mobileOpen, collapsed, setMobileOpen } = useLayout();
  const { user } = useAuth();

  const [openSecurity, setOpenSecurity] = useState(true);
  const [openAI, setOpenAI] = useState(true);
  const [openLearning, setOpenLearning] = useState(true);
  const [openProgress, setOpenProgress] = useState(true);
  const [openAdmin, setOpenAdmin] = useState(true);

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true; // If no roles specified, show to all
    return item.roles.includes(user?.role || "student");
  });

  const drawerContent = (
    <Box className="sidebar">
      {/* Logo */}
      <Toolbar>
        <Typography variant="h6" fontWeight="bold" color="primary">
          CyberShield
        </Typography>
      </Toolbar>

      <List>
        {filteredMenuItems.map((item, index) => {
          if (item.group) {
            const openState = {
              Security: openSecurity,
              AI: openAI,
              Learning: openLearning,
              Progress: openProgress,
              Admin: openAdmin
            };
            const toggle = {
              Security: () => setOpenSecurity(!openSecurity),
              AI: () => setOpenAI(!openAI),
              Learning: () => setOpenLearning(!openLearning),
              Progress: () => setOpenProgress(!openProgress),
              Admin: () => setOpenAdmin(!openAdmin)
            };

            const isOpen = openState[item.group];
            const handleToggle = toggle[item.group];

            // Filter children based on role
            const filteredChildren = item.children?.filter(child => {
              if (!child.roles) return true;
              return child.roles.includes(user?.role || "student");
            }) || [];

            if (filteredChildren.length === 0) return null;

            return (
              <Box key={item.group}>
                <ListItemButton onClick={handleToggle}>
                  <ListItemText primary={item.group} />
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {filteredChildren.map((child) => (
                      <ListItemButton
                        key={child.path}
                        component={NavLink}
                        to={child.path}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{child.icon}</ListItemIcon>
                        <ListItemText primary={child.title} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  // Calculate sidebar width based on state
  const getSidebarWidth = () => {
    if (isMobile) return 0; // Hidden on mobile (drawer mode)
    if (collapsed || isTablet) return 80; // Collapsed or tablet
    return 260; // Desktop expanded
  };

  const sidebarWidth = getSidebarWidth();

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: 260,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop/Tablet Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: sidebarWidth,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          "& .MuiDrawer-paper": {
            width: sidebarWidth,
            boxSizing: "border-box",
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}