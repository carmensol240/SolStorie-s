import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isAiCreditError, shouldRaiseCreditAlert } from "./ai-credit-alert.ts";
import { decideStoryReadiness } from "./story-readiness.ts";

Deno.test("402 and credit-limit 403 count as 'AI balance ran out'", () => {
  assertEquals(isAiCreditError(402, ""), true);
  assertEquals(isAiCreditError(403, '{"type":"credit_limit_reached"}'), true);
  assertEquals(isAiCreditError(403, "forbidden"), false);
  assertEquals(isAiCreditError(429, "Not enough credits"), false);
  assertEquals(isAiCreditError(500, ""), false);
});

Deno.test("alert + email at most once an hour", () => {
  const now = new Date("2026-11-10T10:00:00Z");
  assertEquals(shouldRaiseCreditAlert(null, now), true);
  assertEquals(shouldRaiseCreditAlert("2026-11-10T09:30:00Z", now), false);
  assertEquals(shouldRaiseCreditAlert("2026-11-10T09:00:00Z", now), true);
});

Deno.test("a story with a page left without a picture is not ready", () => {
  assertEquals(decideStoryReadiness([1, 3, 5], new Set([1, 3, 5]), new Set()), "ready");
  assertEquals(decideStoryReadiness([1, 3, 5], new Set([1, 5]), new Set([3])), "needs_attention");
  assertEquals(decideStoryReadiness([1, 3, 5], new Set([1]), new Set([3])), "waiting");
});
