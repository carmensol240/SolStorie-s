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
  it("new photo + consent without an avatar → cannot continue (no avatar = no story)", () => {
    expect(canProceedWithPhoto("https://x/p.jpg", true)).toBe(false);
    expect(canProceedWithPhoto("https://x/p.jpg", true, false, "")).toBe(false);
  });
  it("new photo + consent + its avatar → can continue", () => {
    expect(canProceedWithPhoto("https://x/p.jpg", true, false, "data:image/png;base64,AAA")).toBe(true);
  });
  it("saved profile with an avatar → can continue without new upload or consent", () => {
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

import { shouldBounceToPhotoStep } from "@/lib/photo-optional";
describe("refresh on step 3 with a saved child", () => {
  it("stays on step 3 while the restored child's face check has not run yet", () => {
    expect(shouldBounceToPhotoStep({ step: 3, selectedChildId: "c1", savedFace: { id: null, has: false, loading: false }, canProceed: false })).toBe(false);
  });
  it("stays on step 3 while the face check is loading", () => {
    expect(shouldBounceToPhotoStep({ step: 3, selectedChildId: "c1", savedFace: { id: "c1", has: false, loading: true }, canProceed: false })).toBe(false);
  });
  it("stays on step 3 when the saved child has a face", () => {
    expect(shouldBounceToPhotoStep({ step: 3, selectedChildId: "c1", savedFace: { id: "c1", has: true, loading: false }, canProceed: true })).toBe(false);
  });
  it("goes back to step 2 when the saved child has no face", () => {
    expect(shouldBounceToPhotoStep({ step: 3, selectedChildId: "c1", savedFace: { id: "c1", has: false, loading: false }, canProceed: false })).toBe(true);
  });
  it("goes back to step 2 with no saved child and no photo", () => {
    expect(shouldBounceToPhotoStep({ step: 3, selectedChildId: null, savedFace: { id: null, has: false, loading: false }, canProceed: false })).toBe(true);
  });
});
