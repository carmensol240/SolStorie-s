import { describe, it, expect } from "vitest";
import { getReadingIllustrationUrl, getPublicIllustrationUrl } from "@/lib/illustration-url";

describe("redrawn picture version", () => {
  it("reading copy keeps the ?v= version so phones download the new picture", () => {
    const url = getReadingIllustrationUrl("abc/page-1.png?v=123")!;
    expect(url).toContain("/render/image/public/story-illustrations/abc/page-1.png");
    expect(url).toContain("v=123");
  });
  it("print original keeps the version too", () => {
    expect(getPublicIllustrationUrl("abc/page-1.png?v=123")).toMatch(/page-1\.png\?v=123$/);
  });
  it("a new version gives a different address than the old one", () => {
    expect(getReadingIllustrationUrl("abc/page-1.png?v=1")).not.toBe(getReadingIllustrationUrl("abc/page-1.png?v=2"));
  });
});
