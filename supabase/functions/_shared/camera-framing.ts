// Picture framing for story pages.
// Stories created at/after CONSISTENT_FRAMING_CUTOFF keep the hero at a similar size on
// every page (eye level, waist/knees up, face visible). Older stories keep the original
// six-angle rotation so their redraws get exactly the same instructions as before.
export const CONSISTENT_FRAMING_CUTOFF = "2026-11-11T12:00:00Z";

export const LEGACY_CAMERA_ANGLES = [
  "close-up portrait shot focusing on the character's face and upper body",
  "wide establishing shot showing the full scene and environment",
  "medium shot from waist up with environment visible behind",
  "bird's eye view looking down at the scene from above",
  "low angle shot looking up at the character heroically",
  "three-quarter front view at the character's eye level, face clearly visible, scene around",
];

export const CONSISTENT_CAMERA_ANGLES = [
  "medium shot at the character's eye level, framed from the waist up, face clearly visible facing the viewer, scene visible behind",
  "medium-full shot at the character's eye level, framed from the knees up, face clearly visible facing the viewer, scene around",
  "three-quarter front view at the character's eye level, framed from the knees up, face clearly visible, scene around",
];

export const CONSISTENT_SIZE_RULE =
  "HERO SIZE (SAME ON EVERY PAGE): camera at the child's eye level — never from above, never from below, no wide shot where the hero is small, no face-only close-up. The hero fills about half of the image height, framed from the waist or knees up, face fully visible and turned toward the viewer. Vary the place, action and lighting between pages — never the hero's size.";

export function usesConsistentFraming(createdAt: string | null | undefined): boolean {
  if (!createdAt) return true; // a story being drawn for the first time
  const t = Date.parse(createdAt);
  return Number.isNaN(t) ? true : t >= Date.parse(CONSISTENT_FRAMING_CUTOFF);
}

export function pickFramingAngle(pageNumber: number, lastPageNumber: number | null, offset: number, consistent: boolean): string {
  if (consistent) return CONSISTENT_CAMERA_ANGLES[(pageNumber + offset) % CONSISTENT_CAMERA_ANGLES.length];
  const angle = LEGACY_CAMERA_ANGLES[(pageNumber + offset) % LEGACY_CAMERA_ANGLES.length];
  if (lastPageNumber !== null && pageNumber === lastPageNumber && angle === LEGACY_CAMERA_ANGLES[0]) {
    return LEGACY_CAMERA_ANGLES[2];
  }
  return angle;
}

export function framingComposition(angle: string, consistent: boolean): string {
  if (consistent) return `${CONSISTENT_SIZE_RULE}`;
  return angle === LEGACY_CAMERA_ANGLES[0]
    ? "head and upper body clearly framed, face fully visible, not cropped"
    : "full body head to toe with feet grounded on surface";
}
