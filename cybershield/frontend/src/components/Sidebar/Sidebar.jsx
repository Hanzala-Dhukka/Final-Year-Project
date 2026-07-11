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
  Box
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import { menuItems } from "./menuItems";
import "./Sidebar.css";

export default function Sidebar() {
  const [openSecurity, setOpenSecurity] = useState(true);
  const [openAI, setOpenAI] = useState(true);
  const [openLearning, setOpenLearning] = useState(true);
  const [openProgress, setOpenProgress] = useState(true);

  const drawerContent = (
    <Box className="sidebar">
      {/* Logo */}
      <Toolbar>
        <Typography variant="h6" fontWeight="bold" color="primary">
          CyberShield
        </Typography>
      </Toolbar>

      <List>
        {menuItems.map((item, index) => {
          if (item.group) {
            const openState = {
              Security: openSecurity,
              AI: openAI,
              Learning: openLearning,
              Progress: openProgress
            };
            const toggle = {
              Security: () => setOpenSecurity(!openSecurity),
              AI: () => setOpenAI(!openAI),
              Learning: () => setOpenLearning(!openLearning),
              Progress: () => setOpenProgress(!openProgress)
            };

            const isOpen = openState[item.group];
            const handleToggle = toggle[item.group];

            return (
              <Box key={item.group}>
                <ListItemButton onClick={handleToggle}>
                  <ListItemText primary={item.group} />
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
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

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 260,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 260,
          boxSizing: "border-box"
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
}