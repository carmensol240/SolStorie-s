# Check of the two alerts (nothing was changed)

## Alert 1: "Stories created without a photo never get illustrations"
**Status: half real.** The danger exists, but no parent can reach it through the site today.

- **Not caused by today's changes.** It comes from an earlier rule in the picture function: "never draw a single page without a face". New stories are drawn one page at a time, so this rule also applies to first drawings. If a story has no face at all, every page is refused and the story stays stuck on "preparing illustrations".
- **Through the form: not possible.** The photo-optional check now means the opposite of its name: step 2 continues only with a new photo + consent, or with a saved child who has a photo or avatar. The old plan, "the child's photo is optional, not required", was never carried out. The alert describes how the code worked before.
- **Free taste / saved child:** these go through the same step 2, so the same rule applies.
- **The real gap:** the step 2 check runs only on the screen. Someone who calls the server directly, with no photo and no saved child, still gets a story written and charged, and then it gets stuck without pictures.
- **Live data:** all 3 stories from the last 3 days had a photo, and all were drawn fully (2 free tastes with 2 pictures each, 1 paid story with 6). No new stuck story.

**Proposed fix:** make the server refuse a story without a face before any charge or AI call, with a clear Hebrew message. Also fix the picture rule so it applies only to a redraw, as a backup.

## Alert 2: "Refreshing the topic step sends parents back to the photo step"
**Status: real, still happens.** A parent picks a saved child and reaches the topic step. After a refresh, or when coming back from payment, the page sends them back to the photo step. The page restores the chosen child only in its memory, not on the screen, so it "doesn't know" the child has a photo.

**Proposed fix:** when restoring the saved answers, also restore the chosen child on the screen, and wait for the face check before sending back. Add a test for "refresh on step 3 with a saved child stays on step 3".

## Test story (to run after approval)
A test story with a photo in carmit1901+test. Plan mode doesn't let me create it now.
1. Create one regular story with a photo for a saved child.
2. Confirm it reaches "ready" and that every page has a picture (also checked in the picture logs).
3. Report: how long it took, which drawing service was used, and screenshots of the reader.
4. No credit is charged: the account is an admin.

## Technical details
- Picture guard: generate-illustrations/index.ts around line 1603. Proposed condition: `isRedraw && !effectivePhoto`.
- Server face requirement: generate-story/index.ts around line 1388. Return 422 when `effectivePhoto` is empty and no saved child has a face, before the story row is inserted or anything is charged.
- Refresh: CreateStory.tsx line 277. Also call `setSelectedChildId(d.selectedChildId)`.
- After the fixes, mark both alerts as fixed.
