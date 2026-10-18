// Free taste: a new user with no credits may create ONE story; only the first
// pages are shown and illustrated until the story is paid for.

/** Story pages visible (and illustrated) in a taste. Toddlers: 3, everyone else: 4. */
export function tastePageLimit(ageRange: string | null | undefined): number {
  return ageRange === "0-2" ? 3 : 4;
}

/** Max taste claims from one network address in 30 days. */
export const TASTE_MAX_PER_IP_30D = 3;

/**
 * One mailbox = one taste. "+alias" is removed for every domain; dots are
 * removed only for gmail.com / googlemail.com (other providers treat dots as real).
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at <= 0) return null;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  if (!local) return null;
  return `${local}@${domain}`;
}

export interface TasteEligibilityInput {
  hasPriorStory: boolean;
  userClaimed: boolean;
  emailClaimed: boolean;
  deviceClaimed: boolean;
  ipClaimsLast30d: number;
}

export type TasteDecision = { eligible: true } | { eligible: false; reason: string };

export function decideTasteEligibility(i: TasteEligibilityInput): TasteDecision {
  if (i.hasPriorStory) return { eligible: false, reason: "prior_story" };
  if (i.userClaimed) return { eligible: false, reason: "user_claimed" };
  if (i.emailClaimed) return { eligible: false, reason: "email_claimed" };
  if (i.deviceClaimed) return { eligible: false, reason: "device_claimed" };
  if (i.ipClaimsLast30d >= TASTE_MAX_PER_IP_30D) return { eligible: false, reason: "ip_limit" };
  return { eligible: true };
}

/** Story packages whose purchase from the taste lock screen opens that taste. Print file / coloring never do. */
export const TASTE_UNLOCK_PACKAGES = new Set([
  "single_story",
  "single_story_digital",
  "single_story_full",
  "basic",
  "popular",
]);

// ---------- Unlock ----------

export type CreditKind = "digital" | "full";

/** Spend credits by kind. null kind = parent didn't choose: full first, then digital. */
export async function spendCredit(
  consume: (kind: CreditKind) => Promise<CreditKind | null>,
  kind: CreditKind | null | undefined,
): Promise<CreditKind | null> {
  if (kind) return consume(kind);
  return (await consume("full")) ?? (await consume("digital"));
}

export interface TasteUnlockStore {
  getStory(storyId: string): Promise<{ id: string; user_id: string | null; is_taste: boolean } | null>;
  /** Take one credit of this kind; returns the kind taken, or null if none. */
  consume(userId: string, kind: CreditKind): Promise<CreditKind | null>;
  refund(userId: string, kind: CreditKind): Promise<void>;
  /** Flip is_taste true->false only if still true. Returns false if someone else already did. */
  markUnlocked(storyId: string): Promise<boolean>;
}

export type UnlockResult =
  | { kind: "unlocked"; creditKind: CreditKind }
  | { kind: "not_found" }
  | { kind: "not_owner" }
  | { kind: "not_taste" }
  | { kind: "no_credits" }
  | { kind: "error"; error: string };

/**
 * Opens a taste story with one story credit. Opens ONLY when the story belongs
 * to `userId` and is still a taste; otherwise nothing is charged.
 */
export async function unlockTasteStory(
  store: TasteUnlockStore, userId: string, storyId: string, creditKind?: CreditKind | null,
): Promise<UnlockResult> {
  const story = await store.getStory(storyId);
  if (!story) return { kind: "not_found" };
  if (!story.user_id || story.user_id !== userId) return { kind: "not_owner" };
  if (!story.is_taste) return { kind: "not_taste" };

  const spent = await spendCredit((k) => store.consume(userId, k), creditKind);
  if (!spent) return { kind: "no_credits" };
  if (await store.markUnlocked(storyId)) return { kind: "unlocked", creditKind: spent };
  // Opened in parallel by another request: give the credit back.
  await store.refund(userId, spent);
  return { kind: "not_taste" };
}

/** One-way code of the normalized email, kept after account deletion so the taste isn't given twice. */
export async function emailTasteHash(email: string | null | undefined): Promise<string | null> {
  const n = normalizeEmail(email);
  if (!n) return null;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`taste-email:${n}`));
  return "sha256:" + Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
