

## Plan: Enforce Strict 3D Disney Pixar Style Across All Image Generation

### Problem
The current `fal-ai/instant-character` and `fal-ai/flux/schnell` prompts produce inconsistent styles that don't match the desired 3D Disney Pixar look shown in the reference images (warm golden lighting, smooth 3D rendering, large expressive eyes, detailed textures like Coco/Encanto/Inside Out).

### What Changes

A single **STYLE_PROMPT** constant will be defined in each of the 3 edge functions, used in every prompt path (Instant Character with photo, Schnell without photo, cover generation). This ensures the same visual DNA regardless of model or scenario.

**New unified style block:**
```
3D DISNEY PIXAR ANIMATION STYLE. Render exactly like a frame from Coco, Encanto, or Inside Out 2. 
Smooth matte 3D surfaces, subsurface skin scattering, warm cinematic golden-hour lighting.
Characters: large round expressive eyes with visible iris highlights, soft rosy cheeks, 
detailed textured hair with individual strand groups, small button nose.
Environment: rich detailed backgrounds with depth-of-field bokeh, warm color palette, 
cozy atmospheric lighting with soft shadows.
Full body from head to toe, feet visible and grounded. Portrait 4:3 framing.
DO NOT render in 2D, flat illustration, anime, watercolor, or photorealistic style.
```

### Files to Edit

1. **`supabase/functions/generate-illustrations/index.ts`**
   - Update `generateIllustrationWithFace()` prompt (line ~180) — replace the style section
   - Update `generateIllustration()` prompt (line ~276) — replace `stylePrefix`
   - Both paths get the same style constant

2. **`supabase/functions/generate-cover/index.ts`**
   - Update personalized cover prompt (line ~166) — same style block
   - Update Gemini fallback cover prompt if it exists

3. **`supabase/functions/retry-illustration/index.ts`**
   - Update both Instant Character and Schnell prompt paths with the same style constant

### No Structural Changes
- Same models (`instant-character` + `schnell` fallback)
- Same photo resolution logic (base64 → upload → signed URL)
- Same cast descriptions
- Only the style/quality instructions in prompts change

