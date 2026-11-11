// Share links (/s/<slug>): bought stories open fully, tastes stay limited, no parent details leak.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const URL_ = "https://qvdwmkxviaqcgmjotsxe.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2ZHdta3h2aWFxY2dtam90c3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MzIyNDgsImV4cCI6MjA4NTQwODI0OH0.naD48N3Ieta9EaIyRpjJ9R48hxV11n1UGU850LS9ABU";

async function publicStory(slug: string) {
  const r = await fetch(`${URL_}/rest/v1/rpc/get_public_story`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_story_id: slug }),
  });
  return await r.json();
}

Deno.test("purchased story j00da3 returns all 12 pages without sign-in", async () => {
  const s = await publicStory("j00da3");
  assertEquals(s.is_purchased, true);
  assertEquals(s.pages.length, 12);
});

Deno.test("unpurchased taste returns at most 4 pages (ages 2-4)", async () => {
  const s = await publicStory("3mx710");
  assertEquals(s.is_purchased, false);
  assert(s.pages.length <= 4, `got ${s.pages.length}`);
  assert(s.total_pages > s.pages.length);
});

Deno.test("no parent details in the share payload", async () => {
  const s = await publicStory("j00da3");
  for (const k of ["user_id", "email", "phone", "child_id", "child_photo_path"]) assertEquals(k in s, false, k);
  assert(!JSON.stringify(s).includes("@"));
});

Deno.test("unknown slug returns nothing", async () => {
  assertEquals(await publicStory("zz-not-a-slug-zz"), null);
});
