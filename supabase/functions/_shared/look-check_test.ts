import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isLookOnly, lookProblemsFrom, pagesWithLookIssue } from "./look-check.ts";
import { decideStoryReadiness } from "./story-readiness.ts";

Deno.test("blue eyes, flat style and changed emblem are each a problem", () => {
  assertEquals(lookProblemsFrom({ eye_color_match: false, render_style_match: false, emblem_match: false, hair_tone_match: true }),
    ["eye color", "render style", "emblem"]);
});
Deno.test("look-only vs mixed with a different child", () => {
  assertEquals(isLookOnly(["eye color", "emblem"]), true);
  assertEquals(isLookOnly(["eye color", "different child"]), false);
});
Deno.test("kept look mismatch makes a fully drawn story need attention; a later passing redraw clears it", () => {
  const issues = pagesWithLookIssue([{ page_number: 3, identity_check: "look mismatch kept: eye color", created_at: "2026-01-01T00:00:00Z" }]);
  assertEquals(decideStoryReadiness([1, 3], new Set([1, 3]), new Set(), null, issues), "needs_attention");
  const cleared = pagesWithLookIssue([
    { page_number: 3, identity_check: "look mismatch kept: eye color", created_at: "2026-01-01T00:00:00Z" },
    { page_number: 3, identity_check: "match", created_at: "2026-01-02T00:00:00Z" },
  ]);
  assertEquals(decideStoryReadiness([1, 3], new Set([1, 3]), new Set(), null, cleared), "ready");
});
