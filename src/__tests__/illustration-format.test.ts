import { describe, it, expect } from "vitest";
import { readSwitch, decideFormat, formatRule, backupSizeFor } from "../../supabase/functions/_shared/illustration-format";

describe("square pictures switch", () => {
  it("missing or unknown switch means today's landscape pictures", () => {
    expect(decideFormat(readSwitch(undefined), true)).toBe("landscape");
    expect(decideFormat(readSwitch("yes"), true)).toBe("landscape");
  });
  it("test mode gives square only to admin (test) accounts", () => {
    expect(decideFormat(readSwitch("test"), true)).toBe("square");
    expect(decideFormat(readSwitch("test"), false)).toBe("landscape");
  });
  it("on gives square to everyone", () => {
    expect(decideFormat(readSwitch("on"), false)).toBe("square");
  });
  it("landscape stories get no extra drawing text and the wide backup size", () => {
    expect(formatRule("landscape")).toBe("");
    expect(backupSizeFor("scene")).toBe("1536x1024");
  });
  it("square stories ask every drawing (and the backup) for a square picture", () => {
    const rule = formatRule("square");
    expect(rule).toContain("1:1");
    expect(backupSizeFor("scene" + rule)).toBe("1024x1024");
  });
});
