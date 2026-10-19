import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getTopicType, requiredTechniques, isSensitiveTopic, runNlpCheck, gangPresent, buildNlpInstruction, TECHNIQUES } from "../_shared/nlp-techniques.ts";

Deno.test("13 techniques including gang modeling", () => {
  assertEquals(TECHNIQUES.length, 13);
  assertEquals(TECHNIQUES[12].he, "מודלינג דרך החבורה");
});

Deno.test("topic types per approved table", () => {
  assertEquals(getTopicType("fear-of-dark"), "fears");
  assertEquals(getTopicType("new-house"), "transitions");
  assertEquals(getTopicType("potty-training"), "habits");
  assertEquals(getTopicType("sharing"), "social");
  assertEquals(getTopicType("body-safety"), "safety");
  assertEquals(getTopicType("seatbelt-safety"), "safety");
  assertEquals(getTopicType("independence"), "growth");
  assertEquals(getTopicType("superheroes"), "growth");
  assertEquals(getTopicType("making-mistakes"), "growth");
  assertEquals(getTopicType("zoo-adventure"), "general");
  assertEquals(getTopicType("letter-alef"), "general");
});

Deno.test("sensitive topics are exactly the four", () => {
  for (const t of ["sick-grandparent", "dad-in-reserves", "safe-room-sirens", "divorce"]) assert(isSensitiveTopic(t));
  assert(!isSensitiveTopic("fear-of-dark"));
  assert(buildNlpInstruction("divorce", "he").includes("אסור בהחלט להבטיח תוצאה"));
});

Deno.test("safety requires 5,11,9,4,12 and no-blame rule", () => {
  assertEquals(requiredTechniques("safety", { gangPresent: true }), ["positive_phrasing", "predictability", "coping_strategy", "normalization", "secure_ending"]);
  assert(buildNlpInstruction("body-safety", "he").includes("בלי להאשים"));
});

Deno.test("growth requires 1,7,10,6 + modeling only with gang", () => {
  assertEquals(requiredTechniques("growth", { gangPresent: true }), ["growth", "reframing", "positive_reinforcement", "success_presupposition", "gang_modeling"]);
  assertEquals(requiredTechniques("growth", { gangPresent: false }).includes("gang_modeling"), false);
  assertEquals(requiredTechniques("fears", { gangPresent: false }).includes("gang_modeling"), false);
});

Deno.test("gang detection ignores 'בן חמש'", () => {
  assert(gangPresent(["זואי נושמת עמוק"], "דני"));
  assert(!gangPresent(["דני בן חמש והוא שמח"], "דני"));
});

const pages = [{ page_number: 1, text: "סבתא חולה ונועה עצובה" }, { page_number: 2, text: "סבתא תבריא מחר בטוח" }];

Deno.test("outcome promise triggers a rewrite of that page", async () => {
  const calls: string[] = [];
  const res = await runNlpCheck({
    pages, topicId: "sick-grandparent", language: "he", childName: "נועה",
    call: async ({ label }) => {
      calls.push(label);
      if (label === "nlp-check") return JSON.stringify({ techniques: [], issues: [{ kind: "outcome_promise", page: 2, quote: "סבתא תבריא מחר בטוח" }] });
      if (label === "nlp-fix") return JSON.stringify({ pages: [{ page_number: 2, text: "נועה מחבקת את הדובי שלה" }] });
      return JSON.stringify({ techniques: [], issues: [] });
    },
  });
  assertEquals(calls, ["nlp-check", "nlp-fix", "nlp-recheck"]);
  assertEquals(res.report.fixed_pages, [2]);
  assertEquals(res.report.issues[0].fixed, true);
  assertEquals(res.pages[1].text, "נועה מחבקת את הדובי שלה");
});

Deno.test("check failure never blocks: original pages kept, story flagged", async () => {
  const res = await runNlpCheck({ pages, topicId: "fear-of-dark", language: "he", call: async () => null });
  assertEquals(res.pages, pages);
  assertEquals(res.report.flagged, true);
  assertEquals(res.report.error, "check_failed");
});

Deno.test("all present → no fix call", async () => {
  const calls: string[] = [];
  const req = requiredTechniques("general", { gangPresent: false });
  const res = await runNlpCheck({
    pages, topicId: "zoo-adventure", language: "he",
    call: async ({ label }) => { calls.push(label); return JSON.stringify({ techniques: req.map((c) => ({ code: c, present: true, page: 1, quote: "x" })), issues: [] }); },
  });
  assertEquals(calls, ["nlp-check"]);
  assertEquals(res.report.flagged, false);
});
