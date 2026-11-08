import { describe, it, expect } from "vitest";
import { choosePhonePictureLayout, stackedPictureHeight } from "@/lib/phone-picture-layout";

describe("phone reader, long text: whole picture on top, text below", () => {
  it("a wide picture is shown at full width, uncropped (height = width / ratio)", () => {
    expect(stackedPictureHeight({ cardWidth: 352, cardHeight: 700, ratio: 1408 / 768, textHeight: 300 })).toBe(192);
  });

  it("a tall picture shrinks so the text still starts on the card", () => {
    expect(stackedPictureHeight({ cardWidth: 352, cardHeight: 700, ratio: 704 / 1488, textHeight: 300 })).toBe(400);
  });

  it("very long text never squeezes the picture below 40% of the card", () => {
    expect(stackedPictureHeight({ cardWidth: 352, cardHeight: 700, ratio: 704 / 1488, textHeight: 650 })).toBe(280);
  });
});

describe("phone reader, ages 0–4: picture fills the card unless the text covers more than a third", () => {
  it("short text (a quarter of the card) stays on the full-card picture", () => {
    expect(choosePhonePictureLayout(175, 700)).toBe("cover");
  });

  it("text covering exactly a third still stays on the picture", () => {
    expect(choosePhonePictureLayout(200, 600)).toBe("cover");
  });

  it("text covering more than a third moves below the whole picture", () => {
    expect(choosePhonePictureLayout(201, 600)).toBe("stacked");
    expect(choosePhonePictureLayout(400, 700)).toBe("stacked");
  });

  it("no text (cover slide) or unknown card size keeps the full-card picture", () => {
    expect(choosePhonePictureLayout(0, 700)).toBe("cover");
    expect(choosePhonePictureLayout(300, 0)).toBe("cover");
  });
});
