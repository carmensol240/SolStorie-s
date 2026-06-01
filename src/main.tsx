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

// ---------------------------------------------------------------------------
// Auto-reload on new deploy
// ---------------------------------------------------------------------------
// Poll the root HTML periodically. If its content hash changes, a new version
// was deployed — force a hard reload so users (and the Lovable preview) never
// stay stuck on a stale build.
(() => {
  const POLL_MS = 30_000;

  const hash = async (s: string) => {
    try {
      const buf = new TextEncoder().encode(s);
      const digest = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Fallback: simple string hash
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return String(h);
    }
  };

  const fetchHtmlHash = async (): Promise<string | null> => {
    try {
      const res = await fetch(`/?_v=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      const text = await res.text();
      // Hash only the <script> + <link> asset references — those change on every
      // new build (Vite emits hashed filenames). This avoids false positives
      // from dynamic meta/SSR content.
      const assets =
        text.match(/(?:src|href)="[^"]*\/assets\/[^"]+"/g)?.join("|") || text;
      return await hash(assets);
    } catch {
      return null;
    }
  };

  let initial: string | null = null;
  let reloading = false;

  const check = async () => {
    if (reloading) return;
    const current = await fetchHtmlHash();
    if (!current) return;
    if (initial === null) {
      initial = current;
      return;
    }
    if (current !== initial) {
      reloading = true;
      // Clear caches + SW before hard reload so the new HTML is fetched fresh.
      try {
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
      } catch {
        // ignore
      }
      window.location.reload();
    }
  };

  // Prime the baseline, then poll.
  void check();
  setInterval(check, POLL_MS);
  // Also check when the tab regains focus — covers users returning after a deploy.
  window.addEventListener("focus", () => void check());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
})();

createRoot(document.getElementById("root")!).render(<App />);
