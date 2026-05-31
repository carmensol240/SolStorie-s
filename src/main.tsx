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
  let hadSW = false;
  const cleanup = async () => {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length > 0) hadSW = true;
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      if (names.length > 0) hadSW = true;
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    // If this tab was being served by a stale SW, force one hard reload so the
    // user sees the latest published HTML instead of the cached shell.
    if (hadSW && !sessionStorage.getItem("__sw_cleanup_reloaded")) {
      sessionStorage.setItem("__sw_cleanup_reloaded", "1");
      window.location.reload();
    }
  };
  cleanup();
} else {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
