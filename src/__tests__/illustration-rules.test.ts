import { describe, it, expect } from "vitest";
import {
  PIXAR_STYLE, PIXAR_STYLE_COMPACT, CHARACTER_CONSISTENCY_PROMPT, NEGATIVE_PROMPT,
  buildOutfitLock, isHeroCastName,
} from "../../supabase/functions/_shared/style-config";

describe("illustration rules", () => {
  it("every style text forbids text in the picture", () => {
    for (const s of [PIXAR_STYLE, PIXAR_STYLE_COMPACT]) expect(s).toContain("no text, no letters, no words, no captions, no signs");
  });
  it("hero appears once, page 1 composition is never copied", () => {
    expect(CHARACTER_CONSISTENCY_PROMPT).toContain("EXACTLY ONCE");
    expect(CHARACTER_CONSISTENCY_PROMPT).toContain("no twins");
    expect(CHARACTER_CONSISTENCY_PROMPT).toContain("NEVER copy a reference image's composition");
  });
  it("named friends are not banned by the negative prompt", () => {
    expect(NEGATIVE_PROMPT).not.toContain("multiple characters");
    expect(NEGATIVE_PROMPT).not.toContain("group shot");
  });
  it("chosen clothes forbid a cape unless chosen", () => {
    expect(buildOutfitLock("blue everyday clothes")).toContain("NO cape");
    expect(buildOutfitLock("blue everyday clothes")).toContain("blue everyday clothes");
  });
  it("a hero named Sol does not pull in the Sol cast card", () => {
    expect(isHeroCastName("sol", "סול")).toBe(true);
    expect(isHeroCastName("mia", "סול")).toBe(false);
    expect(isHeroCastName("sol", "")).toBe(false);
  });
});

import { storyTextForPrompt as _stp } from "../../supabase/functions/_shared/style-config";
describe("story text in picture prompts", () => {
  it("removes nikud and forbids writing the words in the picture", () => {
    const out = _stp("סוֹל שׁוֹמַעַת");
    expect(out).toContain('"סול שומעת"');
    expect(out).toMatch(/NEVER write/);
  });
});
