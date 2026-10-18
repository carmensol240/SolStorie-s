// Cookie consent: necessary cookies always work; ad/analytics trackers only with choice "all".
export const CONSENT_KEY = "cookie_consent";
export const CONSENT_VERSION = "2026-10-18";
export const CONSENT_TEXT =
  "אנחנו משתמשים בעוגיות כדי שהאתר יעבוד, ובאישורך גם כדי לשפר את הפרסום שלנו.";

export type ConsentChoice = "all" | "necessary";
export interface ConsentRecord { choice: ConsentChoice; version: string; at: string }

export function getConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw);
    return r && (r.choice === "all" || r.choice === "necessary") ? r : null;
  } catch { return null; }
}

/** Read fresh on every send. Only an explicit "all" allows Meta / Google Analytics. */
export function hasAdConsent(): boolean {
  return getConsent()?.choice === "all";
}

export function setConsent(choice: ConsentChoice): ConsentRecord {
  const rec: ConsentRecord = { choice, version: CONSENT_VERSION, at: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(rec));
  window.dispatchEvent(new Event("consent-changed"));
  return rec;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("open-cookie-settings"));
}
