import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { plannedIllustrationPages, firstCastAppearances, enforceCastAndTastePictures } from "./story-cast-pages.ts";

Deno.test("taste's last page is planned with a picture (2-4: page 4)", () => {
  assertEquals(plannedIllustrationPages(12, "2-4", 4), [1, 3, 4, 5, 7, 9, 11]);
  assertEquals(plannedIllustrationPages(12, "2-4", null), [1, 3, 5, 7, 9, 11]);
  assertEquals(plannedIllustrationPages(8, "0-2", 3), [1, 2, 3, 4, 5, 6, 7, 8]);
});

Deno.test("cast first appearance found with prefix and nikud; 'בן' alone is not Ben", () => {
  const pages = [
    { page_number: 1, text: "נועם בן שלוש אוהב חיות." },
    { page_number: 2, text: "אבא יוצא לדרך." },
    { page_number: 4, text: "סוֹל, הגיבורה הקטנה מחבורת סול וחברים, באה לבקר." },
    { page_number: 5, text: "וסול מחייכת." },
  ];
  const m = firstCastAppearances(pages);
  assertEquals(m.get("sol"), 4);
  assertEquals(m.has("ben"), false);
});

Deno.test("taste page 4 and Sol's first page get a picture that shows Sol", () => {
  const pages = [
    { page_number: 1, text: "נועם מחבק דובי.", illustration_prompt: "Noam hugs teddy", _illustrate: true },
    { page_number: 2, text: "סול באה לבקר.", illustration_prompt: null, _illustrate: false },
    { page_number: 3, text: "נועם נושם.", illustration_prompt: "Noam breathes", _illustrate: true },
    { page_number: 4, text: "נועם מצייר.", illustration_prompt: null, _illustrate: false },
  ];
  assertEquals(enforceCastAndTastePictures(pages, { tastePages: 4 }), [2, 4]);
  assertEquals(pages[1]._illustrate, true);
  assertEquals(pages[3]._illustrate, true);
});

Deno.test("an existing prompt without the cast member gets their description", () => {
  const pages = [{ page_number: 3, text: "מיה מגיעה.", illustration_prompt: "Noam in a field", _illustrate: true }];
  enforceCastAndTastePictures(pages, { tastePages: null });
  assertEquals(pages[0].illustration_prompt!.includes("Mia"), true);
});

Deno.test("hero named Sol: Sol is not treated as a cast member", () => {
  const pages = [{ page_number: 2, text: "סול משחקת.", illustration_prompt: null, _illustrate: false }];
  assertEquals(enforceCastAndTastePictures(pages, { tastePages: null, skip: ["sol"] }), []);
});
