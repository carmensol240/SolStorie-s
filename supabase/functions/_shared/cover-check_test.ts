import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { coverProblemsFrom, keptTryAfterFailedRedraws, COVER_KEPT_PREFIX } from "./cover-check.ts";
import { pagesWithLookIssue } from "./look-check.ts";
import { decideStoryReadiness } from "./story-readiness.ts";

Deno.test("cover is never failed for a missing scarf, an emblem or 'no reference'", () => {
  assertEquals(coverProblemsFrom(
    { outfit_ok: false, outfit_match_page1: false, emblem_match: false, same_child: true, hair_tone_match: true, eye_color_match: true, render_style_match: true },
    { hasAvatar: true },
  ), []);
});

Deno.test("cover vs avatar: different child, hair, eyes and non-3D style are problems", () => {
  assertEquals(coverProblemsFrom(
    { same_child: false, hair_tone_match: false, eye_color_match: false, render_style_match: false },
    { hasAvatar: true },
  ), ["different child", "hair tone", "eye color", "render style"]);
});

Deno.test("page 1 that failed every redraw keeps the closest picture (not empty) and needs attention", () => {
  const tries = [
    { image: "a", problems: ["different child", "hair tone"], reason: "first" },
    { image: "b", problems: ["eye color"], reason: "second" },
    { image: "c", problems: ["different child", "eye color", "render style"], reason: "third" },
  ];
  const kept = keptTryAfterFailedRedraws(1, false, tries);
  assertEquals(kept?.best.image, "b");
  assertEquals(kept?.cover, true);
  assertEquals(kept!.identityCheck.startsWith(COVER_KEPT_PREFIX), true);
  const issues = pagesWithLookIssue([{ page_number: 1, identity_check: kept!.identityCheck, created_at: "2026-11-11T00:00:00Z" }]);
  assertEquals(decideStoryReadiness([1, 3], new Set([1, 3]), new Set(), null, issues), "needs_attention");
});

Deno.test("page 1 is kept even when every try shows a different child", () => {
  const kept = keptTryAfterFailedRedraws(1, false, [{ problems: ["different child"], reason: "x" }]);
  assertEquals(kept !== null, true);
});

Deno.test("pages 2+ unchanged: non-look problems keep nothing, look-only keeps the closest", () => {
  assertEquals(keptTryAfterFailedRedraws(3, false, [{ problems: ["different child"], reason: "x" }]), null);
  const kept = keptTryAfterFailedRedraws(3, false, [
    { problems: ["eye color", "emblem"], reason: "a" },
    { problems: ["emblem"], reason: "b" },
  ]);
  assertEquals(kept?.best.reason, "b");
  assertEquals(kept?.cover, false);
});

Deno.test("a redraw of an existing page never uses this (old picture stays)", () => {
  assertEquals(keptTryAfterFailedRedraws(1, true, [{ problems: ["eye color"], reason: "x" }]), null);
});
