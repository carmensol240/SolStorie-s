

## Plan: Upgrade Image Quality — Ultra-High Fidelity 3D Pixar Prompts

### Current State
- PDF sharing via `navigator.share` — **already implemented** ✅
- IndexedDB for offline storage — **already implemented** ✅  
- `stripBase64ForStorage` preventing localStorage quota errors — **already implemented** ✅
- Style prompt exists but lacks rendering keywords (Octane, volumetric fog, bokeh, etc.)

### What Changes

**Single change: Upgrade the style block in all 3 edge functions** to include ultra-high fidelity rendering keywords and explicit bokeh/depth-of-field instructions.

**New unified style block:**
```
Ultra-high fidelity 3D Disney Pixar animation style, cinematic soft lighting, 
volumetric fog, Octane render quality. Render exactly like a frame from Coco, 
Encanto, or Inside Out 2. Smooth matte 3D surfaces, subsurface skin scattering, 
warm golden-hour cinematic lighting. Characters: intricate detailed hair with 
individual strand groups, large round expressive eyes with visible iris highlights, 
soft rosy cheeks, small button nose. Environment: shallow depth-of-field with 
strong background bokeh blur to make character pop, vibrant saturated colors, 
cozy atmospheric lighting with soft volumetric shadows. Masterpiece quality, 8K.
FULL BODY head to toe, feet GROUNDED. 
DO NOT render in 2D, flat, anime, watercolor, or photorealistic style.
```

Key additions vs current prompts:
- `Octane render quality` — triggers higher-fidelity 3D rendering
- `volumetric fog` — adds atmospheric depth
- `intricate hair detail` — replaces generic "textured hair"
- `shallow depth-of-field with strong background bokeh blur` — makes character pop
- `vibrant saturated colors, masterpiece quality, 8K` — quality boosters

### Files to Edit
1. `supabase/functions/generate-illustrations/index.ts` — lines 180-194 (instant-character prompt) and line 276 (schnell stylePrefix)
2. `supabase/functions/generate-cover/index.ts` — lines 166-168 (personalized cover) and line 286 (Gemini cover)  
3. `supabase/functions/retry-illustration/index.ts` — lines 155 and 166-168 (both paths)

### No Other Changes Needed
PDF sharing and storage quota fixes are already live and working.

