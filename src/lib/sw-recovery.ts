/**
 * Emergency release from a broken/stale build: unregister the app service
 * worker, delete app-shell caches (never offline illustrations / IndexedDB),
 * and reload once. A sessionStorage stamp prevents reload loops.
 * Every API is feature-checked so unsupported browsers (Safari) skip silently.
 */
import { shouldDeferAutoReload } from "@/lib/story-generation-session";

export const RECOVERY_FLAG = "__sw_recovery_at";
export const RECOVERY_WINDOW_MS = 10 * 60 * 1000;
const APP_SHELL_CACHE = /(workbox-precache|^html$|^app-images$)/;

export function isAppShellCache(name: string): boolean {
  return APP_SHELL_CACHE.test(name);
}

export function isBrokenBuildError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string };
  if (e.name === "ReferenceError" || e.name === "ChunkLoadError") return true;
  const msg = String(e.message || err);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .* failed/i.test(msg);
}

export async function recoverFromBrokenBuild(opts: { reload?: () => void } = {}): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    if (shouldDeferAutoReload(window.location.pathname)) return false;
    let last = 0;
    try { last = Number(sessionStorage.getItem(RECOVERY_FLAG) || 0); } catch { /* ignore */ }
    if (last && Date.now() - last < RECOVERY_WINDOW_MS) return false;
    try { sessionStorage.setItem(RECOVERY_FLAG, String(Date.now())); } catch { /* ignore */ }

    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker?.getRegistrations) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map((r) => r.unregister()));
      }
    } catch { /* ignore */ }
    try {
      if (typeof caches !== "undefined") {
        const names = await caches.keys();
        await Promise.allSettled(names.filter(isAppShellCache).map((n) => caches.delete(n)));
      }
    } catch { /* ignore */ }

    (opts.reload ?? (() => window.location.reload()))();
    return true;
  } catch {
    return false;
  }
}
