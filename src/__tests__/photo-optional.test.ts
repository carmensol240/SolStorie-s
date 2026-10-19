import { describe, it, expect } from "vitest";
import { canProceedWithPhoto } from "@/lib/photo-optional";
import { PIXAR_STYLE, PIXAR_STYLE_COMPACT } from "../../supabase/functions/_shared/style-config";

describe("optional child photo", () => {
  it("can continue without a photo", () => {
    expect(canProceedWithPhoto(null, false)).toBe(true);
    expect(canProceedWithPhoto("", false)).toBe(true);
  });
  it("needs consent when a photo was added", () => {
    expect(canProceedWithPhoto("https://x/p.jpg", false)).toBe(false);
    expect(canProceedWithPhoto("https://x/p.jpg", true)).toBe(true);
  });
});

describe("style instruction", () => {
  const d = "high-quality 3D animated feature film style, soft global illumination, rounded friendly proportions, large expressive eyes, smooth stylized skin, vibrant warm colors";
  it("is in both style texts, without cast names", () => {
    for (const s of [PIXAR_STYLE, PIXAR_STYLE_COMPACT]) {
      expect(s).toContain(d);
      expect(s).not.toMatch(/\b(Sol|Ben|Mia|Zoe|Leo)\b/);
    }
  });
});
