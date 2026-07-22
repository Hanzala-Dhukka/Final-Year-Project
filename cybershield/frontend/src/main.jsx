import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./styles/global.css";
import "./styles/variables.css";
import "./styles/theme.css";

import { ThemeProvider } from "./theme/ThemeProvider";
import MuiThemeBridge from "./theme/MuiThemeBridge";
import { ToastProvider } from "./components/Animation/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <MuiThemeBridge>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MuiThemeBridge>
  </ThemeProvider>
);
