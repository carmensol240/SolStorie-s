# Closer likeness: steps 1–3 + test (approved scope)

Only new stories (from a new cutoff time) and redraws you approve. Character sheet and two drawings per page: not now. Locked rules stay.

## 1. Picture shape
- Every drawing and redraw gets an explicit shape instruction from the story's illustration_format: landscape 3:2, square 1:1 or portrait. Where the image service supports it, the shape is also requested as a setting.
- The real width and height are measured. A wrong shape counts as a failed check and gets a corrected redraw (max 2). After that the previous picture stays and you get an alert. No AI cost.

## 2. Distinguishing traits from the avatar
- The existing avatar analysis also returns 5–8 precise traits: face shape, eyebrows, hair length, direction and parting, ears, nose, freckles or marks. They're saved once per story.
- They're written into the face paragraph of every page and redraw, and checked in the face check.

## 3. Bigger face
- Mostly waist-up framing (about 2 of 3 pages), knees-up only when the action needs it. The hero is about half to 60% of the image height. Eye level stays; no bird's-eye, low angle, wide shot or face-only close-up.
- Locked rule 5 changes to "about half to 60% of the image height" (written approval given). The camera-framing test is updated, never weakened. I can't edit the project settings myself, so I'll give you the exact text to paste there.

## Test (test tool only, nothing saved to any story)
- Uriel pages 3 and 5 (his avatar is only read), plus 2 pages of Noam. Each page is drawn with the current method and with the new method (steps 1–3), side by side with the avatar.
- I'll report the shape, style and face-check results and the number of redraws for each picture.
- At the end, the test images and the test tool are deleted.

## Cost (estimates)
- Per story: about the same as today; a shape redraw only when a picture comes out the wrong shape.
- Test: 8 drawings + checks, about 40–80 cents.
- Build: about 3–6 credits + 2–4 for the test.

## Files
- `_shared/illustration-format.ts`: shape rules + size check.
- `_shared/style-check.ts`: shape failure + traits in the face check.
- `_shared/avatar-traits.ts`: traits extraction (+ migration: `stories.hero_traits`).
- `_shared/illustration-prompt.ts`: traits in the face paragraph.
- `_shared/camera-framing.ts` + test: mostly waist-up after a new cutoff time.
- `generate-illustrations`, `retry-illustration`: request + check the shape, use the traits.
- Temporary test function, deleted at the end. Tests run before reporting.
