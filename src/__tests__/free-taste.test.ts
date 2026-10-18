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
import { splitCredits } from "@/hooks/use-credit-kinds";

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

function unlockStore(story: { id: string; user_id: string | null; is_taste: boolean } | null, credits: number, full = 0) {
  const s = { story, credits, full };
  const store: TasteUnlockStore = {
    async getStory() { return s.story ? { ...s.story } : null; },
    async consume(_u, kind) {
      if (s.credits <= 0) return null;
      if (kind === "full") { if (s.full <= 0) return null; s.full--; }
      else if (s.credits - s.full <= 0) return null;
      s.credits--; return kind;
    },
    async refund(_u, kind) { s.credits++; if (kind === "full") s.full++; },
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
      async consume() { return null; },
      async refund() {},
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

describe("credits remember their package", () => {
  it("a full credit opens the taste as a full story", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "u1", is_taste: true }, 2, 1);
    const r = await unlockTasteStory(store, "u1", "st", "full");
    expect(r).toEqual({ kind: "unlocked", creditKind: "full" });
    expect(s.full).toBe(0);
    expect(s.credits).toBe(1);
  });
  it("choosing digital keeps the full credit", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "u1", is_taste: true }, 2, 1);
    const r = await unlockTasteStory(store, "u1", "st", "digital");
    expect(r).toEqual({ kind: "unlocked", creditKind: "digital" });
    expect(s.full).toBe(1);
  });
  it("asking for a full credit without one opens nothing", async () => {
    const { s, store } = unlockStore({ id: "st", user_id: "u1", is_taste: true }, 1, 0);
    expect((await unlockTasteStory(store, "u1", "st", "full")).kind).toBe("no_credits");
    expect(s.story!.is_taste).toBe(true);
  });
  it("splits the balance into full and digital", () => {
    expect(splitCredits(3, 1)).toEqual({ full: 1, digital: 2, total: 3 });
    expect(splitCredits(1, 5)).toEqual({ full: 1, digital: 0, total: 1 });
  });
});

import { claimStoryRequest } from "../../supabase/functions/_shared/story-request";

describe("creating a story with the chosen credit", () => {
  function store(credits: number, full: number) {
    const s = { credits, full, rows: 0 };
    const st: StoryRequestStore = {
      async insertPlaceholder() { s.rows++; return { id: `s${s.rows}` }; },
      async findByRequest() { return null; },
      async consume(_u, kind) {
        if (s.credits <= 0) return null;
        if (kind === "full") { if (s.full <= 0) return null; s.full--; }
        else if (s.credits - s.full <= 0) return null;
        s.credits--; return kind;
      },
      async refund() {},
      async deleteStory() { s.rows--; },
    };
    return { s, st };
  }
  it("full chosen: the story is a full story and the full credit is used", async () => {
    const { s, st } = store(2, 1);
    const r = await claimStoryRequest(st, "u1", "req-12345678", {}, "full");
    expect(r).toEqual({ kind: "claimed", storyId: "s1", creditKind: "full" });
    expect(s.full).toBe(0);
  });
  it("digital chosen: the full credit stays", async () => {
    const { s, st } = store(2, 1);
    const r = await claimStoryRequest(st, "u1", "req-12345678", {}, "digital");
    expect(r).toEqual({ kind: "claimed", storyId: "s1", creditKind: "digital" });
    expect(s.full).toBe(1);
  });
  it("only full credits and no choice sent: uses the full credit", async () => {
    const { st } = store(1, 1);
    const r = await claimStoryRequest(st, "u1", "req-12345678", {});
    expect(r).toMatchObject({ kind: "claimed", creditKind: "full" });
  });
  it("no credits: nothing is created", async () => {
    const { s, st } = store(0, 0);
    expect((await claimStoryRequest(st, "u1", "req-12345678", {})).kind).toBe("no_credits");
    expect(s.rows).toBe(0);
  });
});
