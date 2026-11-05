import { describe, it, expect } from "vitest";
import { canProceedWithPhoto } from "@/lib/photo-optional";
import { PIXAR_STYLE, PIXAR_STYLE_COMPACT } from "../../supabase/functions/_shared/style-config";

describe("required child photo", () => {
  it("no photo → cannot continue", () => {
    expect(canProceedWithPhoto(null, false)).toBe(false);
    expect(canProceedWithPhoto("", true)).toBe(false);
  });
  it("new photo without consent → cannot continue", () => {
    expect(canProceedWithPhoto("https://x/p.jpg", false)).toBe(false);
  });
  it("new photo + consent → can continue", () => {
    expect(canProceedWithPhoto("https://x/p.jpg", true)).toBe(true);
  });
  it("saved profile with avatar/photo → can continue without new upload or consent", () => {
    expect(canProceedWithPhoto(null, false, true)).toBe(true);
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
