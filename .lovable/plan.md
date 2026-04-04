

## Plan: Fix 3 Issues — Cover Rotation, Kippah, Coloring Pages

### Issue 1: Cover Image Rotated 90°

**Root cause:** The `SignedImage` component uses `imageOrientation: 'none'` (line 106), which ignores EXIF orientation data. However, the cover images displayed in `ContinueReading.tsx` and `story-of-the-day.tsx` use plain `<img>` tags without this fix, so they respect EXIF and may rotate. Meanwhile, the `polaroid-card.tsx` and `story-book-card.tsx` use `imageOrientation: 'from-image'` which also reads EXIF.

**Fix:** The cover images on cards (`story-book-card.tsx`, `polaroid-card.tsx`) currently use `imageOrientation: 'from-image'` — change these to `'none'` to match `SignedImage` behavior. Also add `imageOrientation: 'none'` to the plain `<img>` tags in `ContinueReading.tsx` and `story-of-the-day.tsx`.

**Files:** `src/components/ui/story-book-card.tsx`, `src/components/ui/polaroid-card.tsx`, `src/components/home/ContinueReading.tsx`, `src/components/story/story-of-the-day.tsx`

---

### Issue 2: Sol Wearing a Kippah

**Root cause:** In `generate-illustrations/index.ts`, the outfit generation prompt includes an example: `"חנוכה" → "traditional Jewish festive blue and white tunic with a small kippah"`. The AI uses this as a template and applies kippah to all characters including girls. The negative prompts already say "no kippah on girls" but the positive prompt overrides it.

**Fix:**
1. Change the Hanukkah example to remove kippah: `"חנוכה" → "traditional Jewish festive blue and white tunic with a golden Star of David necklace"`
2. Add gender-awareness to the outfit prompt: instruct the AI to never include kippah for female characters, and use a blue hair ribbon or bow instead
3. Strengthen the instruction in the prompt itself (not just negative prompt)

**File:** `supabase/functions/generate-illustrations/index.ts`

---

### Issue 3: Coloring Pages Not Loading

**Root cause:** The logs show: `models/gemini-2.0-flash-exp is not found for API version v1beta`. Google deprecated/removed this model.

**Fix:** Change the model in `generate-coloring-page/index.ts` from `gemini-2.0-flash-exp` to `gemini-2.0-flash` (the stable version that supports image generation via `responseModalities`).

**File:** `supabase/functions/generate-coloring-page/index.ts` — update the model name on line 122.

---

### Summary of changes

| File | Change |
|------|--------|
| `supabase/functions/generate-coloring-page/index.ts` | Model `gemini-2.0-flash-exp` → `gemini-2.0-flash` |
| `supabase/functions/generate-illustrations/index.ts` | Remove kippah from examples, add gender-aware outfit instruction |
| `src/components/ui/story-book-card.tsx` | `imageOrientation: 'from-image'` → `'none'` |
| `src/components/ui/polaroid-card.tsx` | `imageOrientation: 'from-image'` → `'none'` |
| `src/components/home/ContinueReading.tsx` | Add `style={{ imageOrientation: 'none' }}` to cover `<img>` |
| `src/components/story/story-of-the-day.tsx` | Add `style={{ imageOrientation: 'none' }}` to cover `<img>` |

