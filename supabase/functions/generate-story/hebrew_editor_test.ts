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
