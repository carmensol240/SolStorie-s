import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  decideTasteEligibility,
  tastePageLimit,
  unlockTasteStory,
  TASTE_UNLOCK_PACKAGES,
  type TasteUnlockStore,
} from "../../supabase/functions/_shared/taste";
import { claimTasteRequest, type StoryRequestStore, type TasteClaimStore } from "../../supabase/functions/_shared/story-request";
import { normalizeGender } from "../../supabase/functions/_shared/gender";

const none = { hasPriorStory: false, userClaimed: false, emailClaimed: false, deviceClaimed: false, ipClaimsLast30d: 0 };

describe("free taste — limits", () => {
  it("shows 4 pages, 3 for toddlers", () => {
    expect(tastePageLimit("5-7")).toBe(4);
    expect(tastePageLimit("2-4")).toBe(4);
    expect(tastePageLimit("0-2")).toBe(3);
  });

  it("removes +alias on every domain", () => {
    expect(normalizeEmail("Name+1@walla.com")).toBe("name@walla.com");
    expect(normalizeEmail("carmit1901+test@gmail.com")).toBe("carmit1901@gmail.com");
  });

  it("removes dots only for gmail.com / googlemail.com", () => {
    expect(normalizeEmail("c.armit@gmail.com")).toBe("carmit@gmail.com");
    expect(normalizeEmail("c.armit@googlemail.com")).toBe("carmit@gmail.com");
    expect(normalizeEmail("first.last@walla.com")).toBe("first.last@walla.com");
  });

  it("blocks a second taste for the same account, mailbox or device", () => {
    expect(decideTasteEligibility(none).eligible).toBe(true);
    expect(decideTasteEligibility({ ...none, userClaimed: true }).eligible).toBe(false);
    expect(decideTasteEligibility({ ...none, emailClaimed: true }).eligible).toBe(false);
    expect(decideTasteEligibility({ ...none, deviceClaimed: true }).eligible).toBe(false);
    expect(decideTasteEligibility({ ...none, hasPriorStory: true }).eligible).toBe(false);
  });

  it("allows 3 tastes per network in 30 days, blocks the 4th", () => {
    expect(decideTasteEligibility({ ...none, ipClaimsLast30d: 2 }).eligible).toBe(true);
    expect(decideTasteEligibility({ ...none, ipClaimsLast30d: 3 }).eligible).toBe(false);
  });

  it("print file and coloring purchases never open a taste", () => {
    expect(TASTE_UNLOCK_PACKAGES.has("pdf")).toBe(false);
    expect(TASTE_UNLOCK_PACKAGES.has("coloring_single")).toBe(false);
    expect(TASTE_UNLOCK_PACKAGES.has("popular")).toBe(true);
    expect(TASTE_UNLOCK_PACKAGES.has("single_story")).toBe(true);
  });
});

function unlockStore(story: { id: string; user_id: string | null; is_taste: boolean } | null, credits: number) {
  const s = { story, credits };
  const store: TasteUnlockStore = {
    async getStory() { return s.story ? { ...s.story } : null; },
    async getCredits() { return s.credits; },
    async casCredits(_u, from, to) { if (s.credits !== from) return false; s.credits = to; return true; },
    async markUnlocked() { if (!s.story?.is_taste) return false; s.story.is_taste = false; return true; },
  };
  return { s, store };
}

describe("free taste — opening after payment", () => {
  it("opens the buyer's own taste and takes exactly one credit", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "u1", is_taste: true }, 1);
    expect((await unlockTasteStory(store, "u1", "st")).kind).toBe("unlocked");
    expect(s.credits).toBe(0);
    expect(s.story!.is_taste).toBe(false);
  });

  it("does not open another user's story; the credit stays", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "other", is_taste: true }, 1);
    expect((await unlockTasteStory(store, "u1", "st")).kind).toBe("not_owner");
    expect(s.credits).toBe(1);
    expect(s.story!.is_taste).toBe(true);
  });

  it("does not charge for a story that is already open", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "u1", is_taste: false }, 2);
    expect((await unlockTasteStory(store, "u1", "st")).kind).toBe("not_taste");
    expect(s.credits).toBe(2);
  });

  it("opening twice in parallel charges once", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "u1", is_taste: true }, 2);
    const r = await Promise.all([unlockTasteStory(store, "u1", "st"), unlockTasteStory(store, "u1", "st")]);
    expect(r.filter((x) => x.kind === "unlocked")).toHaveLength(1);
    expect(s.credits).toBe(1);
  });

  it("without a credit nothing opens", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "u1", is_taste: true }, 0);
    expect((await unlockTasteStory(store, "u1", "st")).kind).toBe("no_credits");
    expect(s.story!.is_taste).toBe(true);
  });
});

describe("free taste — creating", () => {
  function stores(claimTaken: boolean) {
    const rows: Record<string, unknown>[] = [];
    const store: StoryRequestStore = {
      async insertPlaceholder(row) { rows.push(row); return { id: `s${rows.length}` }; },
      async findByRequest() { return null; },
      async getCredits() { return 0; },
      async casCredits() { return false; },
      async deleteStory(id) { const i = rows.findIndex((_, k) => `s${k + 1}` === id); if (i >= 0) rows[i] = { deleted: true }; },
    };
    const claims: TasteClaimStore = { async insertClaim() { return !claimTaken; }, async deleteClaimForStory() {} };
    return { rows, store, claims };
  }

  it("creates a taste story with no credit", async () => {
    const { rows, store, claims } = stores(false);
    const r = await claimTasteRequest(store, claims, "u1", "req-12345678", { is_taste: true }, {});
    expect(r.kind).toBe("claimed");
    expect(rows[0].is_taste).toBe(true);
  });

  it("an already-used taste removes the new row and is refused", async () => {
    const { rows, store, claims } = stores(true);
    const r = await claimTasteRequest(store, claims, "u1", "req-12345678", { is_taste: true }, {});
    expect(r.kind).toBe("not_eligible");
    expect(rows[0]).toEqual({ deleted: true });
  });
});

describe("saved child gender", () => {
  it("old 'boy'/'girl' profiles create a boy/girl story", () => {
    expect(normalizeGender("boy")).toBe("male");
    expect(normalizeGender("girl")).toBe("female");
    expect(normalizeGender("male")).toBe("male");
    expect(normalizeGender("other")).toBe(null);
  });
});

import { decideTastePurchaseExtras } from "../../supabase/functions/_shared/taste";

describe("free taste — what an opened taste gets", () => {
  it("full story: print file + one coloring page per picture, all for that story", () => {
    expect(decideTastePurchaseExtras("popular", "unlocked", 12, 4)).toEqual({ storyPdf: true, globalPdf: false, storyColoring: 12, generalColoring: 0 });
  });
  it("digital story: 1 coloring page for that story, no print file", () => {
    expect(decideTastePurchaseExtras("single_story", "unlocked", 12, 4)).toEqual({ storyPdf: false, globalPdf: false, storyColoring: 1, generalColoring: 0 });
  });
  it("someone else's story: nothing tied to it, credits go to the general balance", () => {
    expect(decideTastePurchaseExtras("popular", "not_owner", 12, 4)).toEqual({ storyPdf: false, globalPdf: true, storyColoring: 0, generalColoring: 4 });
  });
  it("digital purchase that didn't open gives no story extras", () => {
    expect(decideTastePurchaseExtras("single_story", "not_taste", 12, 12)).toEqual({ storyPdf: false, globalPdf: false, storyColoring: 0, generalColoring: 0 });
  });
});
