import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasTimeFor, pageCheckReference, waitsForPageOne, INVOCATION_BUDGET_MS, REDRAW_NEEDS_MS } from "./page-run.ts";
import { keptTryAfterFailedRedraws } from "./cover-check.ts";
import { redrawDecision, STYLE_PROBLEM } from "./style-check.ts";

Deno.test("short instruction: pages are checked against the avatar only, never page 1", () => {
  assertEquals(pageCheckReference(5, true, "https://x/page-1.png"), null);
  assertEquals(pageCheckReference(1, true, "https://x/page-1.png"), null);
});

Deno.test("older stories still compare pages 2+ with page 1", () => {
  assertEquals(pageCheckReference(5, false, "https://x/page-1.png"), "https://x/page-1.png");
  assertEquals(pageCheckReference(1, false, "https://x/page-1.png"), null);
});

Deno.test("short instruction: pages do not wait for page 1; older stories do", () => {
  assertEquals(waitsForPageOne(true), false);
  assertEquals(waitsForPageOne(false), true);
});

Deno.test("time net: no new redraw once it would pass the ~140 s budget", () => {
  const start = 0;
  assertEquals(hasTimeFor(start, 30_000), true);
  assertEquals(hasTimeFor(start, INVOCATION_BUDGET_MS - REDRAW_NEEDS_MS), true);
  assertEquals(hasTimeFor(start, INVOCATION_BUDGET_MS - REDRAW_NEEDS_MS + 1), false);
  assertEquals(hasTimeFor(start, 100_000), false);
});

Deno.test("page 1 is never kept as 'closest' when every try is flat 2D", () => {
  assertEquals(keptTryAfterFailedRedraws(1, false, [
    { problems: ["render style", STYLE_PROBLEM], reason: "watercolor" },
    { problems: [STYLE_PROBLEM], reason: "flat" },
  ]), null);
  assertEquals(redrawDecision([{ problems: [STYLE_PROBLEM] }, { problems: ["realistic style"] }], { hadExisting: false, pageNumber: 1 }), { action: "hold" });
});

Deno.test("page 1 still keeps its closest 3D try (never empty while a 3D try exists)", () => {
  const kept = keptTryAfterFailedRedraws(1, false, [
    { problems: [STYLE_PROBLEM], reason: "flat" },
    { problems: ["avatar face"], reason: "3d" },
  ]);
  assertEquals(kept?.best.reason, "3d");
});
