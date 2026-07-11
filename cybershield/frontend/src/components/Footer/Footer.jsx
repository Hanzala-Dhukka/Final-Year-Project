import {
  Box,
  Typography,
  Link,
  Stack,
  Divider,
} from "@mui/material";

import GitHubIcon from "@mui/icons-material/GitHub";
import DescriptionIcon from "@mui/icons-material/Description";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import ContactMailIcon from "@mui/icons-material/ContactMail";

import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" className="footer">

      <Divider />

      <Box className="footer-container">

        <Typography variant="body1" fontWeight="bold">
          🛡 CyberShield
        </Typography>

        <Typography variant="body2">
          AI-Powered Cybersecurity Learning Platform
        </Typography>

        <Typography variant="body2">
          © {year} CyberShield | Version 1.0.0
        </Typography>

        <Stack
          direction="row"
          spacing={3}
          justifyContent="center"
          mt={2}
        >

          <Link href="#" underline="hover">

            <GitHubIcon fontSize="small" />

            GitHub

          </Link>

          <Link href="#" underline="hover">

            <DescriptionIcon fontSize="small" />

            Documentation

          </Link>

          <Link href="#" underline="hover">

            <PrivacyTipIcon fontSize="small" />

            Privacy

          </Link>

          <Link href="#" underline="hover">

            <ContactMailIcon fontSize="small" />

            Contact

          </Link>

        </Stack>

      </Box>

    </Box>
  );
}