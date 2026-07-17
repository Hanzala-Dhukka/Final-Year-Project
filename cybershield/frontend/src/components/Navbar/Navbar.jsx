import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Avatar,
  TextField,
  Chip,
  Menu,
  MenuItem,
  InputAdornment,
  useMediaQuery,
  useTheme
} from "@mui/material";

import {
  Search,
  Notifications,
  LightMode,
  Menu as MenuIcon,
  KeyboardArrowDown,
  AdminPanelSettings
} from "@mui/icons-material";

import { useState } from "react";

import { useLayout } from "../../context/LayoutContext";
import { useResponsive } from "../../hooks/useResponsive";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import "./Navbar.css";

export default function Navbar() {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const { toggleCollapse, toggleMobile } = useLayout();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = () => {
    if (isMobile) {
      toggleMobile();
    } else {
      toggleCollapse();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    closeMenu();
  };

  const handleProfile = () => {
    navigate("/profile");
    closeMenu();
  };

  const handleSettings = () => {
    navigate("/settings");
    closeMenu();
  };

  const handleAdminPanel = () => {
    navigate("/admin");
    closeMenu();
  };

  return (
    <AppBar position="sticky" color="inherit" elevation={1}>
      <Toolbar>

        {/* Left Side */}
        <Box display="flex" alignItems="center" gap={2} flex={1}>

          <IconButton onClick={handleMenuClick}>
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            fontWeight="bold"
            color="primary"
            className="navbar-logo"
          >
            CyberShield
          </Typography>

        </Box>

        {/* Center */}

        <Box flex={2} className="navbar-search" sx={{ display: { xs: 'none', md: 'block' } }}>

          <TextField
            fullWidth
            size="small"
            placeholder="Search scans, reports, quizzes..."

            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />

        </Box>

        {/* Right */}

        <Box
          flex={1}
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          gap={2}
        >

          <Chip
            color="success"
            label="System Healthy"
            sx={{ display: { xs: 'none', lg: 'block' } }}
          />

          <IconButton>

            <LightMode />

          </IconButton>

          <IconButton>

            <Badge
              badgeContent={3}
              color="error"
            >

              <Notifications />

            </Badge>

          </IconButton>

          <Avatar
            src={user?.profile_image ? `http://localhost:8000${user.profile_image}` : null}
            onClick={handleProfile}
            sx={{ cursor: 'pointer' }}
          >
            {user?.full_name?.charAt(0) || "U"}
          </Avatar>

          <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.full_name || "User"}
          </Typography>

          <IconButton
            onClick={openMenu}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <KeyboardArrowDown />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeMenu}
          >
            <MenuItem onClick={handleProfile}>
              Profile
            </MenuItem>

            <MenuItem onClick={handleSettings}>
              Settings
            </MenuItem>

            {user?.role === "admin" && (
              <MenuItem onClick={handleAdminPanel}>
                <AdminPanelSettings sx={{ mr: 1 }} />
                Admin Panel
              </MenuItem>
            )}

            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>

        </Box>

      </Toolbar>
    </AppBar>
  );
}