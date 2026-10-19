import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { shouldDeferAutoReload } from "./lib/story-generation-session";
import { toast } from "sonner";
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
  registerSW({
    immediate: true,
    onRegisteredSW: (_url, reg) => {
      // Check for a new version every 30 minutes and whenever the tab comes back.
      if (!reg) return;
      setInterval(() => void reg.update().catch(() => {}), 30 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") void reg.update().catch(() => {});
      });
    },
  });

  // A new service worker took control (skipWaiting + clientsClaim): load the new version once.
  if ("serviceWorker" in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController) applyNewVersion();
    });
  }
}

// ---------------------------------------------------------------------------
// Apply a new version: reload once, but never in the middle of reading a book
// or creating a story — there, show a small "refresh" notice instead.
// Offline illustration caches are never deleted here.
// ---------------------------------------------------------------------------
let updateHandled = false;
function isBusyPath(path: string) {
  return path.startsWith("/story/") || shouldDeferAutoReload(path);
}
function applyNewVersion() {
  if (updateHandled) return;
  updateHandled = true;
  const path = window.location.pathname;
  if (path.startsWith("/story/")) {
    toast("יש גרסה חדשה", {
      duration: Infinity,
      action: { label: "רענון", onClick: () => window.location.reload() },
    });
    return;
  }
  const tryReload = () => {
    if (isBusyPath(window.location.pathname)) {
      setTimeout(tryReload, 5000);
    } else {
      window.location.reload();
    }
  };
  tryReload();
}

// ---------------------------------------------------------------------------
// Detect a new deploy by polling the root HTML (asset hashes). When it changes,
// ask the service worker to update (it then takes control → controllerchange),
// or apply directly when there is no service worker (preview).
// ---------------------------------------------------------------------------
(() => {
  const POLL_MS = 30_000;

  const fetchAssetsSignature = async (): Promise<string | null> => {
    try {
      const res = await fetch(`/?_v=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return null;
      const text = await res.text();
      const assets = text.match(/(?:src|href)="[^"]*\/assets\/[^"]+"/g)?.join("|");
      return assets || null;
    } catch {
      return null;
    }
  };

  let initial: string | null = null;

  const check = async () => {
    if (updateHandled) return;
    const current = await fetchAssetsSignature();
    if (!current) return;
    if (initial === null) {
      initial = current;
      return;
    }
    if (current === initial) return;
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg && navigator.serviceWorker.controller) {
      await reg.update().catch(() => {});
      // Safety net: if the worker did not take control within 20s, apply anyway.
      setTimeout(() => applyNewVersion(), 20_000);
    } else {
      applyNewVersion();
    }
  };

  void check();
  setInterval(check, POLL_MS);
  window.addEventListener("focus", () => void check());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
})();

createRoot(document.getElementById("root")!).render(<App />);
