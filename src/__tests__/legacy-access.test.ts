import { describe, it, expect } from "vitest";
import { isLegacyOpenStory, withRetry } from "../../supabase/functions/_shared/legacy-access";
import { grantStoryAccess } from "../../supabase/functions/_shared/story-access";

const U = "user-1";
describe("legacy story access", () => {
  it("opens an owned non-taste story created before the cutoff", () => {
    expect(isLegacyOpenStory({ user_id: U, is_taste: false, created_at: "2026-10-17T10:00:00Z" }, U)).toBe(true);
  });
  it("keeps free tastes locked", () => {
    expect(isLegacyOpenStory({ user_id: U, is_taste: true, created_at: "2026-10-17T10:00:00Z" }, U)).toBe(false);
  });
  it("does not open stories created after the cutoff", () => {
    expect(isLegacyOpenStory({ user_id: U, is_taste: false, created_at: "2026-10-19T10:00:00Z" }, U)).toBe(false);
  });
  it("does not open someone else's story", () => {
    expect(isLegacyOpenStory({ user_id: "other", is_taste: false, created_at: "2026-10-17T10:00:00Z" }, U)).toBe(false);
  });
});

describe("unlock record on credit use", () => {
  it("retries until the unlock record is saved", async () => {
    let calls = 0;
    const ok = await withRetry(async () => ({ error: ++calls < 3 ? new Error("x") : null }));
    expect(ok).toBe(true);
    expect(calls).toBe(3);
  });
  it("grantStoryAccess writes the unlock and raises an admin alert if it keeps failing", async () => {
    const writes: string[] = [];
    const fail = (t: string) => ({
      upsert: async () => { writes.push(t); return { error: new Error("down") }; },
      insert: async () => { writes.push(t); return { error: null }; },
    });
    const ok = await grantStoryAccess({ from: fail } as any, U, "s1", "digital");
    expect(ok).toBe(false);
    expect(writes.filter((w) => w === "story_unlocks").length).toBe(3);
    expect(writes).toContain("admin_alerts");
  });
  it("grantStoryAccess succeeds on first try when the database is fine", async () => {
    const sb = { from: () => ({ upsert: async () => ({ error: null }), insert: async () => ({ error: null }) }) };
    expect(await grantStoryAccess(sb as any, U, "s1", "full")).toBe(true);
  });
});
