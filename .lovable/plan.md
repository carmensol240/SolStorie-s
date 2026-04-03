

## Plan: Fix 3 Illustration Issues in Story Viewer

### Issue 1: Double/Split Image — `SignedImage` CSS Bug

**Root cause**: In `src/components/ui/signed-image.tsx`, the `className` prop (e.g. `w-full h-full object-cover`) is applied to **three elements**: the wrapper div (line 79), the placeholder div (line 82), and the `<img>` tag (line 121). The `<img>` is in normal document flow (not absolutely positioned), so it adds its own height to the wrapper — while the placeholder is absolute. This creates a layout where the image content pushes the wrapper taller than expected, and the placeholder (also with the full className) can create a doubled visual.

**Fix**: Make the `<img>` absolutely positioned (`absolute inset-0`) so it fills the wrapper without contributing to flow height. Remove the duplicated `className` from the placeholder div (it only needs `absolute inset-0`). The wrapper div keeps the className for sizing.

### Issue 2: Black Borders — `BookPage.tsx` Dark Background

**Root cause**: `BookPage.tsx` wraps illustration images in a dark purple gradient background (`linear-gradient(135deg, #1a0f3a, #2d1a6e)`) with padding (`p-4 md:p-6`), and the image container is capped at `height: 50vh`. This creates visible dark borders around the illustration instead of a full-bleed fill.

**Fix**: Remove the dark background, remove padding, and make the image container fill the full page (`h-full` instead of `50vh`). Use `absolute inset-0` positioning for the image to fill edge-to-edge.

### Issue 3: Cartoon Doll Style — Prompt Configuration

**Root cause**: `PIXAR_STYLE_COMPACT` in `style-config.ts` (line 16) explicitly says "Characters must look like adorable cartoon dolls — NOT realistic humans" and `TOPIC_IMAGE_STYLE_SUFFIX` (line 106) says the same. This forces a "doll" aesthetic instead of the desired Pixar/Disney 3D CGI style.

**Fix**: Remove the "adorable cartoon dolls" phrasing from both `PIXAR_STYLE_COMPACT` and `TOPIC_IMAGE_STYLE_SUFFIX`. Replace with language that reinforces the consistent Pixar 3D CGI animated movie look without the doll aesthetic.

### Files modified
1. `src/components/ui/signed-image.tsx` — fix double-image layout bug (absolute positioning for img)
2. `src/components/story/book-frame/BookPage.tsx` — remove dark background and padding, full-bleed image
3. `supabase/functions/_shared/style-config.ts` — remove "cartoon dolls" from PIXAR_STYLE_COMPACT and TOPIC_IMAGE_STYLE_SUFFIX

