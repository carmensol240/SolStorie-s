import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { acceptEdit, editHebrewPages, wordsMissingNikud, textHasNikud } from "../_shared/hebrew-editor.ts";

Deno.test("finds Hebrew words of 3+ letters without nikud only", () => {
  assertEquals(wordsMissingNikud("אֲפִלּוּ גיבור את סוֹל, מתכווצת!"), ["גיבור", "מתכווצת"]);
});

Deno.test("detects nikud text", () => {
  assert(textHasNikud(["סוֹל יוֹדַעַת שֶׁאַבָּא אוֹהֵב אוֹתָהּ."]));
  assert(!textHasNikud(["סול יודעת שאבא אוהב אותה."]));
});

Deno.test("rejects edits that drop a name or exceed 300 characters", () => {
  assert(acceptEdit("סול יודעת שאבא אוהב.", "סול יודעת שאבא אוהב אותה.", { nikud: false, names: ["סול"] }));
  assert(!acceptEdit("סול יודעת שאבא אוהב.", "היא יודעת שאבא אוהב אותה.", { nikud: false, names: ["סול"] }));
  assert(!acceptEdit("א".repeat(290), "א".repeat(320), { nikud: false, names: [] }));
});

Deno.test("technical failure keeps the original text", async () => {
  const pages = [{ page_number: 1, text: "סול יודעת שאבא אוהב." }];
  const r = await editHebrewPages({ pages, gender: "female", heroName: "סול", nikud: true, call: async () => null });
  assertEquals(r.pages, pages);
  assert(r.report.error);
});

Deno.test("a page with an unvocalized word is sent back once", async () => {
  let calls = 0;
  const r = await editHebrewPages({
    pages: [{ page_number: 1, text: "סול מרגישה חיבוק" }],
    gender: "female", heroName: "סול", nikud: true,
    call: async () => {
      calls++;
      return JSON.stringify({ pages: [{ page_number: 1, text: calls === 1 ? "סוֹל מַרְגִּישָׁה חיבוק" : "סוֹל מַרְגִּישָׁה חִבּוּק" }] });
    },
  });
  assertEquals(calls, 2);
  assertEquals(r.pages[0].text, "סוֹל מַרְגִּישָׁה חִבּוּק");
  assertEquals(r.report.still_missing_nikud, []);
});

Deno.test("no-nikud story never keeps vowel marks", async () => {
  const r = await editHebrewPages({
    pages: [{ page_number: 1, text: "סול יודעת שאבא אוהב." }],
    gender: "female", heroName: "סול", nikud: false,
    call: async () => JSON.stringify({ pages: [{ page_number: 1, text: "סוֹל יודעת שאבא אוהב אותה." }] }),
  });
  assertEquals(r.pages[0].text, "סול יודעת שאבא אוהב אותה.");
});

// ── Safety net (new stories) ──
import { pageProblems, latinLeftovers } from "../_shared/hebrew-editor.ts";

Deno.test("final check: English letters, missing nikud and unedited pages fail", () => {
  assertEquals(latinLeftovers("ליאו Leo בא and שר", []), ["Leo", "and"]);
  assertEquals(pageProblems("סוֹל מַרְגִּישָׁה", { nikud: true, names: [], edited: true }), []);
  assertEquals(pageProblems("סוֹל and מַרְגִּישָׁה", { nikud: true, names: [], edited: true }), ["english:and"]);
  assertEquals(pageProblems("סוֹל מרגישה", { nikud: true, names: [], edited: true }), ["nikud:מרגישה"]);
  assertEquals(pageProblems("סול מרגישה", { nikud: false, names: [], edited: false, rejectReason: "too_long:320/300" }), ["not_edited:too_long:320/300"]);
});

Deno.test("safety net: a refused edit is sent back with the reason and fixed on the next run", async () => {
  const prompts: string[] = [];
  const r = await editHebrewPages({
    pages: [{ page_number: 1, text: "סול יודעת שאבא אוהב." }, { page_number: 2, text: "נועם שמח." }],
    gender: "female", heroName: "סול", nikud: false, safetyNet: true,
    call: async ({ userPrompt }) => {
      prompts.push(userPrompt);
      if (prompts.length === 1) return JSON.stringify({ pages: [
        { page_number: 1, text: "היא יודעת שאבא אוהב אותה." }, // name dropped → refused
        { page_number: 2, text: "נועם שמח מאוד." },
      ] });
      return JSON.stringify({ pages: [{ page_number: 1, text: "סול יודעת שאבא אוהב אותה." }] });
    },
  });
  assertEquals(prompts.length, 2);
  assert(prompts[1].includes("השם \"סול\" נמחק"));
  assert(!prompts[1].includes("\"page_number\":2"));
  assertEquals(r.pages[0].text, "סול יודעת שאבא אוהב אותה.");
  assertEquals(r.report.problems, {});
  assertEquals(r.report.retries, 1);
});

Deno.test("safety net: at most 2 extra runs, then the failing page is reported (never silent)", async () => {
  let calls = 0;
  const r = await editHebrewPages({
    pages: [{ page_number: 3, text: "ליאו בא לבקר את נועם." }],
    gender: "male", heroName: "נועם", nikud: false, safetyNet: true,
    call: async () => { calls++; return JSON.stringify({ pages: [{ page_number: 3, text: "Leo בא לבקר את נועם." }] }); },
  });
  assertEquals(calls, 3);
  assertEquals(r.report.retries, 2);
  assertEquals(r.report.problems, { "3": ["english:Leo"] });
});

Deno.test("safety net: editor failure is retried and reported when it keeps failing", async () => {
  let calls = 0;
  const pages = [{ page_number: 1, text: "סול יודעת." }];
  const r = await editHebrewPages({ pages, gender: "female", heroName: "סול", nikud: false, safetyNet: true, call: async () => { calls++; return null; } });
  assertEquals(calls, 3);
  assertEquals(r.pages, pages);
  assertEquals(r.report.problems, { "1": ["not_edited:editor_failed"] });
});

Deno.test("safety net: no time left → no extra run, page still reported", async () => {
  let calls = 0;
  const r = await editHebrewPages({
    pages: [{ page_number: 1, text: "סול יודעת." }], gender: "female", heroName: "סול", nikud: true, safetyNet: true,
    canRetry: () => false,
    call: async () => { calls++; return JSON.stringify({ pages: [{ page_number: 1, text: "סוֹל יודעת." }] }); },
  });
  assertEquals(calls, 1);
  assertEquals(r.report.problems, { "1": ["nikud:יודעת"] });
});
