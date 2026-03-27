

## Plan: Eliminate Black Borders/Icons from Illustrations

### Root Cause

The Gemini image generation model (`google/gemini-3-pro-image-preview`) occasionally returns images with thin black borders containing small UI-like icons — despite the existing negative prompt. The negative prompt already mentions these artifacts, but the model sometimes ignores negative instructions. Two fixes are needed: stronger positive prompts + CSS safety net.

### Changes

**1. File: `supabase/functions/_shared/style-config.ts`**

Add a new constant `FULL_BLEED_INSTRUCTION` and prepend it to `PIXAR_STYLE` and `PIXAR_STYLE_COMPACT`:

```
CRITICAL IMAGE REQUIREMENT: The illustration MUST be a clean, full-bleed image that fills the entire canvas edge-to-edge. No borders, no margins, no frames, no UI elements, no icons, no toolbars, no black bars around the edges. The artwork must extend to all four edges of the image with no padding or decorative frame.
```

This will be added as a prefix to the style strings so every illustration call inherits it.

Also strengthen `ILLUSTRATION_NEGATIVE_PROMPT` by adding: `no toolbar, no navigation bar, no crop marks, no frame border, no margin, no padding around image`.

**2. File: `src/pages/StoryViewer.tsx`** — CSS safety net

On all `<img>` tags for illustrations (lines ~1541-1543, ~1615-1617, and combined page), add a slight `scale(1.02)` transform to crop any residual thin borders:

```css
style={{ transform: 'scale(1.02)' }}
```

The parent already has `overflow-hidden` via the page container, so any 1-2% edge content will be clipped. This ensures even if the AI adds a thin border, users never see it.

**3. File: `src/pages/StoryViewer.tsx`** — Cover image (line ~1236)

Apply the same `scale(1.02)` safety to the cover image rendering.

### Technical details

- The `scale(1.02)` approach is a common technique for hiding edge artifacts — it crops ~1% from each edge, invisible to the user but removes thin borders
- The positive prompt reinforcement works better than negative prompts with Gemini models
- All existing illustration generation paths (with-face, no-face, cover, retry) will inherit the updated style strings automatically

### What stays the same
- Image generation models and API calls — unchanged
- Page layout, navigation, all other components — unchanged

