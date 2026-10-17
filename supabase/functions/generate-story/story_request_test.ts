import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { claimStoryRequest, releaseStoryRequest, type StoryRequestStore } from "../_shared/story-request.ts";

const tick = () => new Promise((r) => setTimeout(r, Math.random() * 5));

function memoryStore(credits: number) {
  const stories = new Map<string, { id: string; user_id: string; client_request_id: string; generation_status: string }>();
  const state = { credits, charges: 0 };
  let n = 0;
  const store: StoryRequestStore = {
    async insertPlaceholder(row) {
      await tick();
      for (const s of stories.values()) {
        if (s.user_id === row.user_id && s.client_request_id === row.client_request_id) return { conflict: true };
      }
      const id = `s${++n}`;
      stories.set(id, { id, user_id: row.user_id as string, client_request_id: row.client_request_id as string, generation_status: "generating" });
      return { id };
    },
    async findByRequest(userId, requestId) {
      await tick();
      for (const s of stories.values()) if (s.user_id === userId && s.client_request_id === requestId) return { id: s.id, slug: null, generation_status: s.generation_status };
      return null;
    },
    async getCredits() { await tick(); return state.credits; },
    async casCredits(_u, from, to) {
      await tick();
      if (state.credits !== from) return false;
      state.credits = to;
      if (to < from) state.charges++;
      return true;
    },
    async deleteStory(id) { await tick(); stories.delete(id); },
  };
  return { store, stories, state };
}

Deno.test("two parallel requests with the same ID: one story, one charge", async () => {
  const { store, stories, state } = memoryStore(3);
  const [a, b] = await Promise.all([
    claimStoryRequest(store, "u1", "req-123456", {}),
    claimStoryRequest(store, "u1", "req-123456", {}),
  ]);
  const kinds = [a.kind, b.kind].sort();
  assertEquals(kinds, ["claimed", "duplicate"]);
  assertEquals(stories.size, 1);
  assertEquals(state.charges, 1);
  assertEquals(state.credits, 2);
});

Deno.test("no credits: the saved story row is deleted and nothing is charged", async () => {
  const { store, stories, state } = memoryStore(0);
  const r = await claimStoryRequest(store, "u1", "req-abcdefgh", {});
  assertEquals(r.kind, "no_credits");
  assertEquals(stories.size, 0);
  assertEquals(state.credits, 0);
});

Deno.test("failure after claim: story removed and credit returned", async () => {
  const { store, stories, state } = memoryStore(2);
  const r = await claimStoryRequest(store, "u1", "req-fail0001", {});
  assertEquals(r.kind, "claimed");
  assertEquals(state.credits, 1);
  if (r.kind === "claimed") await releaseStoryRequest(store, "u1", r.storyId);
  assertEquals(stories.size, 0);
  assertEquals(state.credits, 2);
});
