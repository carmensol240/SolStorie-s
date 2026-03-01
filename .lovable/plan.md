

## Plan: Cinematic 3D Pixar Style — Final Prompt Overhaul

### What's Already Done (No Changes Needed)
- PDF sharing via `navigator.share` — already implemented
- IndexedDB for offline storage — already implemented
- `stripBase64ForStorage` for localStorage — already implemented

### What Changes

The current prompts produce "doll-like" flat 3D renders. The user's reference images show a much more cinematic, portrait-photography-inspired 3D style with sculpted facial detail, volumetric hair, and heavy bokeh. The fix is a prompt-only upgrade across the 3 edge functions.

**New unified style block** (replaces current one in all paths):

```
Ultra-high fidelity 3D Disney Pixar character portrait, cinematic close-up 
composition. Sculpted dimensional facial features with soft-focus skin texture, 
natural subtle freckles, subsurface scattering. Large deeply expressive eyes 
with intricate iris reflections, catchlights, and thick lashes. Deeply textured 
voluminous hair with individual strand groups, glossy highlights, and natural 
movement. Warm golden-hour cinematic portrait lighting with soft volumetric fog 
and rim lighting that creates depth and dimension. Background: ALWAYS deeply 
blurred creamy bokeh composed of indistinct warm orbs of light, soft pastel 
colors, and blended organic shapes — shallow depth-of-field isolating the 
character as focal point. Octane render quality, 8K masterpiece. 
DO NOT render flat, simple, doll-like, anime, 2D, watercolor, or photorealistic.
```

Key upgrades vs current prompt:
- **"sculpted dimensional facial features"** + **"natural subtle freckles"** — moves away from smooth doll-like faces
- **"intricate iris reflections, catchlights, thick lashes"** — eye detail matching reference
- **"deeply textured voluminous hair with glossy highlights"** — hair quality matching reference
- **"creamy bokeh composed of indistinct warm orbs of light"** — explicit bokeh description matching reference images
- **"rim lighting"** — creates the edge glow visible in reference images
- Added **"doll-like"** to negative prompt

### Files to Edit
1. **`supabase/functions/generate-illustrations/index.ts`** — Update both `generateIllustrationWithFace` (line 180-194) and `generateIllustration` (line 276) style blocks
2. **`supabase/functions/generate-cover/index.ts`** — Update personalized cover prompt (line 166-168) and standard cover prompt (line 286)
3. **`supabase/functions/retry-illustration/index.ts`** — Update both Instant Character (line 166-168) and Schnell (line 155) style blocks

### Cast Descriptions (tightened for this style)
```
- Ben: toddler boy, voluminous curly dark hair, warm tan skin, green shirt, large brown eyes — 3D Pixar portrait quality
- Zoe: dark-skinned athletic girl, thick voluminous black curls, blue headband, purple-yellow tracksuit — 3D Pixar portrait quality  
- Leo: boy with straight black hair, round glasses, denim overalls — 3D Pixar portrait quality
- Mia: girl with smooth brown bob, small flower crown, green dress — 3D Pixar portrait quality
```

