import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // 👈 import HashRouter
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HashRouter>         {/* 👈 wrap App */}
    <App />
  </HashRouter>
);
