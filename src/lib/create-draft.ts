/**
 * Per-tab draft of the /create form (sessionStorage, keyed by user ID).
 * Never stores image data: a photo is kept only when it is a server address.
 */
const PREFIX = "create_draft_";

const FIELDS = [
  "childName", "childGender", "ageRange", "childAge", "storyLength", "nikud", "language",
  "hairColor", "hairStyle", "clothingType", "clothingColor", "kippah",
  "personalityTraits", "fixedDetails", "className", "photoConsent",
  "topic", "customTopic", "childPhoto", "childAvatarUrl",
] as const;

export interface CreateDraft {
  data: Record<string, unknown>;
  selectedChildId: string | null;
}

const isServerAddress = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && !v.startsWith("data:") && !v.startsWith("blob:");

function store(): Storage | null {
  try { return typeof sessionStorage !== "undefined" ? sessionStorage : null; } catch { return null; }
}

export function draftKey(userId: string) { return `${PREFIX}${userId}`; }

export function saveCreateDraft(userId: string | undefined | null, data: Record<string, unknown>, selectedChildId: string | null) {
  const s = store(); if (!s || !userId) return;
  const clean: Record<string, unknown> = {};
  for (const f of FIELDS) {
    const v = data[f];
    if (v === undefined) continue;
    if (f === "childPhoto" || f === "childAvatarUrl") { if (isServerAddress(v)) clean[f] = v; continue; }
    clean[f] = v;
  }
  if (!isServerAddress(clean.childPhoto)) delete clean.childAvatarUrl;
  try { s.setItem(draftKey(userId), JSON.stringify({ data: clean, selectedChildId })); } catch { /* quota */ }
}

export function loadCreateDraft(userId: string | undefined | null): CreateDraft | null {
  const s = store(); if (!s || !userId) return null;
  try {
    const raw = s.getItem(draftKey(userId));
    if (!raw) return null;
    const d = JSON.parse(raw) as CreateDraft;
    return d && typeof d.data === "object" && d.data ? d : null;
  } catch { return null; }
}

export function clearCreateDraft(userId: string | undefined | null) {
  const s = store(); if (!s || !userId) return;
  try { s.removeItem(draftKey(userId)); } catch { /* ignore */ }
}

export function clearAllCreateDrafts() {
  const s = store(); if (!s) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k?.startsWith(PREFIX)) keys.push(k); }
    keys.forEach((k) => s.removeItem(k));
    s.removeItem("create_wizard_draft");
  } catch { /* ignore */ }
}
