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
  InputAdornment
} from "@mui/material";

import {
  Search,
  Notifications,
  LightMode,
  Menu as MenuIcon,
  KeyboardArrowDown
} from "@mui/icons-material";

import { useState } from "react";

import "./Navbar.css";

export default function Navbar() {

  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" color="inherit" elevation={1}>
      <Toolbar>

        {/* Left Side */}
        <Box display="flex" alignItems="center" gap={2} flex={1}>

          <IconButton>
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

        <Box flex={2} className="navbar-search">

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

          <Avatar>

            H

          </Avatar>

          <Typography>

            Hanzala

          </Typography>

          <IconButton
            onClick={openMenu}
          >

            <KeyboardArrowDown />

          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeMenu}
          >

            <MenuItem onClick={closeMenu}>
              Profile
            </MenuItem>

            <MenuItem onClick={closeMenu}>
              Settings
            </MenuItem>

            <MenuItem onClick={closeMenu}>
              Logout
            </MenuItem>

          </Menu>

        </Box>

      </Toolbar>
    </AppBar>
  );
}