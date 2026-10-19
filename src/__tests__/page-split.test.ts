import { describe, it, expect } from "vitest";
import { splitLongPages, splitPageText, pageLength, MAX_PAGE_CHARS } from "../../supabase/functions/_shared/page-split";

const sentence = "סול הולכת לגן עם חברים טובים ושמחה מאוד היום. "; // ~46 chars
const long = sentence.repeat(10).trim(); // ~460 chars

describe("page length limit for new stories", () => {
  it("limit is 300 characters", () => {
    expect(MAX_PAGE_CHARS).toBe(300);
  });

  it("no page is longer than 300 characters after splitting", () => {
    for (const chunk of splitPageText(long)) expect(pageLength(chunk)).toBeLessThanOrEqual(300);
  });

  it("a page over 300 characters becomes an extra page, keeping all the text", () => {
    const chunks = splitPageText(long);
    expect(chunks.length).toBe(2);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(long.replace(/\s+/g, " "));
  });

  it("nikud does not count toward the limit", () => {
    const withNikud = "סוֹל הוֹלֶכֶת לַגַּן. ".repeat(14).trim();
    expect(pageLength(withNikud)).toBeLessThanOrEqual(300);
    expect(splitPageText(withNikud).length).toBe(1);
  });

  it("continuation pages get no picture and pages are renumbered", () => {
    const pages = [
      { page_number: 1, text: long, illustration_prompt: "scene 1" },
      { page_number: 2, text: "קצר.", illustration_prompt: null },
      { page_number: 3, text: "עוד.", illustration_prompt: "scene 3" },
    ];
    const out = splitLongPages(pages, (p) => p.page_number % 2 === 1);
    expect(out.map((p) => p.page_number)).toEqual([1, 2, 3, 4]);
    expect(out.map((p) => p._illustrate)).toEqual([true, false, false, true]);
    expect(out[1].illustration_prompt).toBeNull();
    expect(out[3].illustration_prompt).toBe("scene 3");
  });
});
