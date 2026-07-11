import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "@fontsource/poppins";

import "./styles/global.css";
import "./styles/variables.css";

import { ThemeProvider } from "@mui/material/styles";

import theme from "./styles/theme";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);