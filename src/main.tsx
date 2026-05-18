import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Guard PWA registration: never run inside Lovable Preview/iframe — it caches
// HTML and makes the preview look stuck on an old version.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host.includes("lovable.dev");

if (isInIframe || isPreviewHost) {
  // Clean up any service worker that was registered in a previous session
  // so users stop being served stale cached HTML in the preview.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
  if ("caches" in window) {
    caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
  }
} else {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
