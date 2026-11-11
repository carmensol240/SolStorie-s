import { describe, it, expect } from "vitest";
import { readSwitch, decideFormat, formatRule, backupSizeFor, shapeMatches } from "../../supabase/functions/_shared/illustration-format";

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
  it("landscape stories ask every drawing for a wide 3:2 picture and keep the wide backup size", () => {
    expect(formatRule("landscape")).toContain("3:2");
    expect(formatRule(null)).toContain("3:2");
    expect(backupSizeFor("scene" + formatRule("landscape"))).toBe("1536x1024");
    expect(backupSizeFor("scene")).toBe("1536x1024");
  });
  it("square stories ask every drawing (and the backup) for a square picture", () => {
    const rule = formatRule("square");
    expect(rule).toContain("1:1");
    expect(backupSizeFor("scene" + rule)).toBe("1024x1024");
  });
  it("a tall picture fails a landscape book, a wide one passes", () => {
    expect(shapeMatches("landscape", { width: 784, height: 1360 })).toBe(false);
    expect(shapeMatches("landscape", { width: 1408, height: 768 })).toBe(true);
    expect(shapeMatches("square", { width: 1024, height: 1024 })).toBe(true);
    expect(shapeMatches("square", { width: 1408, height: 768 })).toBe(false);
    expect(shapeMatches("portrait", { width: 784, height: 1360 })).toBe(true);
    expect(shapeMatches("landscape", null)).toBe(true);
  });
});
