import { describe, it, expect } from "vitest";
import {
  CAST_DESCRIPTIONS,
  CHARACTER_CARDS,
  LEO_DESCRIPTION,
  LEO_REF_URL,
  leoOnPage,
} from "../../supabase/functions/_shared/style-config";

describe("official Leo", () => {
  it("both Leo descriptions use the one official text", () => {
    expect(CAST_DESCRIPTIONS.leo).toBe(LEO_DESCRIPTION);
    expect(CHARACTER_CARDS.leo).toContain(LEO_DESCRIPTION);
  });

  it("official Leo has black hair, round glasses, brown eyes, paintbrush — never brown hair", () => {
    expect(LEO_DESCRIPTION).toMatch(/black hair/);
    expect(LEO_DESCRIPTION).toMatch(/round black glasses/);
    expect(LEO_DESCRIPTION).toMatch(/brown eyes/);
    expect(LEO_DESCRIPTION).toMatch(/paintbrush/);
    expect(LEO_DESCRIPTION).not.toMatch(/brown (short )?(messy )?hair/i);
  });

  it("reference picture comes from our current storage, not the old project", () => {
    expect(LEO_REF_URL).toContain("qvdwmkxviaqcgmjotsxe");
    expect(LEO_REF_URL).not.toContain("xqoxoxxlyfimlbekfjxo");
  });

  it("Leo picture is sent only when Leo is named and the hero is not called Leo", () => {
    expect(leoOnPage("ליאו מגיע עם מכחול", "נועם")).toBe(true);
    expect(leoOnPage("Leo paints a map", "Noa")).toBe(true);
    expect(leoOnPage("נועם הולך ליער", "נועם")).toBe(false);
    expect(leoOnPage("ליאו הולך ליער", "ליאו")).toBe(false);
  });
});
