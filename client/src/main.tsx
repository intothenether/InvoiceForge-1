import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA functionality
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(
      (registration) => {
        console.log("PWA ServiceWorker registered with scope: ", registration.scope);
      },
      (err) => {
        console.log("PWA ServiceWorker registration failed: ", err);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
