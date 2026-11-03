import { describe, it, expect } from "vitest";
import { applyPurchaseCredits } from "../../supabase/functions/_shared/purchase-credits";
import { consumeCredit, grantStoryAccess } from "../../supabase/functions/_shared/story-access";
import { spendCredit } from "../../supabase/functions/_shared/taste";

// Minimal in-memory database: just enough of the client for the purchase → story path.
// consume_story_credit mirrors the SQL function (full needs a lot; digital = total - lots).
function fakeDb(userId: string) {
  const t: Record<string, any[]> = {
    purchases: [], profiles: [{ id: userId, story_credits: 0 }], story_credit_lots: [],
    pdf_entitlements: [], story_unlocks: [], admin_alerts: [], stories: [],
  };
  const query = (table: string) => {
    const filters: [string, string, any][] = [];
    let pendingUpdate: any = null;
    const rows = () => t[table].filter((r) => filters.every(([op, c, v]) =>
      op === "eq" ? r[c] === v : op === "like" ? String(r[c]).startsWith(String(v).replace(/%$/, "")) : true));
    const q: any = {
      select: () => q, in: () => q, limit: () => q,
      eq: (c: string, v: any) => { filters.push(["eq", c, v]); return q; },
      like: (c: string, v: any) => { filters.push(["like", c, v]); return q; },
      maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
      insert: async (row: any) => { t[table].push({ ...row }); return { error: null }; },
      upsert: async (row: any) => { t[table].push({ ...row }); return { error: null }; },
      update: (u: any) => { pendingUpdate = u; return q; },
      then: (res: any) => {
        if (pendingUpdate) rows().forEach((r) => Object.assign(r, pendingUpdate));
        return Promise.resolve({ data: rows(), error: null }).then(res);
      },
    };
    return q;
  };
  const rpc = async (name: string, a: any) => {
    if (name !== "consume_story_credit") return { data: null, error: null };
    const p = t.profiles.find((r) => r.id === a.p_user_id);
    const lots = t.story_credit_lots.filter((l) => l.user_id === a.p_user_id && l.remaining > 0);
    const full = lots.reduce((s, l) => s + l.remaining, 0);
    if (!p || p.story_credits <= 0) return { data: null, error: null };
    if (a.p_kind === "full") { if (!lots.length) return { data: null, error: null }; lots[0].remaining--; }
    else if (p.story_credits - full <= 0) return { data: null, error: null };
    p.story_credits--;
    return { data: a.p_kind, error: null };
  };
  return { t, client: { from: query, rpc } };
}

describe("full story purchase gives the print file for the story made with it", () => {
  it("Grow 'popular' (full story) → next story gets a print permission for that story", async () => {
    const userId = "u1";
    const { t, client } = fakeDb(userId);
    const r = await applyPurchaseCredits({ supabase: client, userId, packageId: "popular", amount: 69.9, orderId: "o1", source: "test" });
    expect(r.success).toBe(true);
    expect(t.story_credit_lots).toHaveLength(1);
    expect(t.story_credit_lots[0]).toMatchObject({ kind: "full", remaining: 1 });

    const spent = await spendCredit((k) => consumeCredit(client, userId, k), null);
    expect(spent).toBe("full");
    await grantStoryAccess(client, userId, "story-1", spent!);
    expect(t.pdf_entitlements).toEqual([expect.objectContaining({ user_id: userId, story_id: "story-1" })]);
    expect(t.story_unlocks[0].unlock_type).toBe("credit_full");
  });

  it("digital story purchase does not give a print permission", async () => {
    const userId = "u2";
    const { t, client } = fakeDb(userId);
    await applyPurchaseCredits({ supabase: client, userId, packageId: "single_story", amount: 39.9, orderId: "o2", source: "test" });
    const spent = await spendCredit((k) => consumeCredit(client, userId, k), null);
    expect(spent).toBe("digital");
    await grantStoryAccess(client, userId, "story-2", spent!);
    expect(t.pdf_entitlements).toHaveLength(0);
  });
});
