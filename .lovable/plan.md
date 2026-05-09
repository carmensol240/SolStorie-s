# Fix cropped demo illustration on mobile

## Problem
On mobile (single column), the illustration page in `DemoStory.tsx` is cropped. The grid cell uses `min-h-[60vh]` and `BookPage` renders the image as `absolute inset-0 ... object-cover` (hardcoded inside `BookPage.tsx`). With `object-cover`, portrait portions of the cast images get cropped at the top/bottom on a tall mobile cell.

## Root cause
The image height comes from two places:
- `DemoStory.tsx`: grid container `min-h-[60vh] md:min-h-[70vh]`
- `BookPage.tsx` (illustration branch): `absolute inset-0 w-full h-full object-cover` — cover crops to fill.

We cannot just add a className to `BookPage` because `object-cover` is hardcoded on its `<img>`. Editing `BookPage.tsx` would affect the real StoryViewer (out of scope).

## Fix (scoped to DemoStory only)
In `src/pages/DemoStory.tsx`, replace the illustration `<BookPage type="illustration" .../>` with an inline illustration block:

- Mobile: container uses `aspect-square` (no fixed `min-h`), image uses `object-contain` on a soft background so the full character is visible, no crop.
- Desktop (`md:`): preserve current look — `aspect-auto h-full` with `object-cover` to fill the spread next to the text page.
- Keep the page-number badge in the same position.
- Keep the text `BookPage` and everything else (header, BookFrame, NavigationArrows, CTA, routing, data) untouched.

No changes to `BookPage.tsx`, `BookFrame.tsx`, `demo-story.ts`, or any other file.

## Files touched
- `src/pages/DemoStory.tsx` — only the illustration cell of the spread.

## Verification
Reload `/demo-story` at 320px width and confirm the full character is visible (no top/bottom crop), then at desktop width confirm the spread still looks like an open book with the illustration filling the left page next to the text.
