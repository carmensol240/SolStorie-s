// Admin dashboard display rules (no effect on purchases, credits or stories).

// The owner's own/test accounts: carmit1901 and souldesign06 (any +alias) at gmail, plus solstories.nlp.
const OWN_ACCOUNT_EMAILS = new Set(["solstories.nlp@gmail.com"]);

// Individual purchases the owner marked as her own tests (Grow order IDs inside package_name).
// Hidden from totals only; the purchase rows themselves are never changed.
const TEST_PURCHASE_ORDER_IDS = ["grow_530661331"];

export function isOwnAccountEmail(email?: string | null): boolean {
  const e = (email || "").trim().toLowerCase();
  if (!e) return false;
  if (OWN_ACCOUNT_EMAILS.has(e)) return true;
  return /^(carmit1901|souldesign06)(\+[^@]*)?@gmail\.com$/.test(e);
}

// A real purchase for the monthly totals: status exactly "completed" (not test_completed),
// made this month, and not by an own account.
export function isRealPurchase(
  p: { status?: string | null; created_at?: string | null; package_name?: string | null },
  monthStart: Date,
  byOwnAccount: boolean,
): boolean {
  if (byOwnAccount || p.status !== "completed" || !p.created_at) return false;
  const pkg = p.package_name || "";
  if (TEST_PURCHASE_ORDER_IDS.some(id => pkg === id || pkg.startsWith(id + "_"))) return false;
  return new Date(p.created_at) >= monthStart;
}

export type StoryLabel = "טעימה" | "סיפור מלא" | "דורש טיפול" | "מוכן";

export function storyLabel(s: { is_taste?: boolean | null; generation_status?: string | null }): StoryLabel[] {
  const out: StoryLabel[] = [s.is_taste ? "טעימה" : "סיפור מלא"];
  if (s.generation_status === "needs_attention") out.push("דורש טיפול");
  else if (!s.generation_status || s.generation_status === "ready") out.push("מוכן");
  return out;
}

export const STORY_LABEL_CLASS: Record<StoryLabel, string> = {
  "טעימה": "bg-secondary text-secondary-foreground",
  "סיפור מלא": "bg-primary/15 text-primary",
  "דורש טיפול": "bg-destructive/15 text-destructive",
  "מוכן": "bg-accent text-accent-foreground",
};
