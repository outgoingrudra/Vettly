
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./Routers/AppRouter.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>,
);
