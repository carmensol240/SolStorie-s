// Loads Meta Pixel + Google Analytics ONLY after consent "all". Nothing is loaded or sent before.
import { hasAdConsent } from "./consent";

const PIXEL_ID = "2132057870988224";
const GA_ID = "G-TWW52645C8";
let loaded = false;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function loadTrackersIfAllowed() {
  if (loaded || !hasAdConsent()) return;
  loaded = true;
  const w = window as any;

  // Meta Pixel base code
  if (!w.fbq) {
    const n: any = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    };
    w.fbq = n; if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    const s = document.createElement("script");
    s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  w.fbq("consent", "grant");
  w.fbq("init", PIXEL_ID);
  w.fbq("track", "PageView");

  // Google Analytics
  const g = document.createElement("script");
  g.async = true; g.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(g);
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID, { anonymize_ip: true });
}

/** Stop sending immediately after withdrawal; loaded code is gone on next page load. */
export function stopTrackers() {
  const w = window as any;
  try { w.fbq?.("consent", "revoke"); } catch { /* ignore */ }
  w[`ga-disable-${GA_ID}`] = true;
}
