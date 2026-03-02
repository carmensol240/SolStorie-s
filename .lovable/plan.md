

## Analysis

The current illustration prompts across all edge functions use a **hyper-cinematic portrait** style with heavy emphasis on "bokeh", "Octane render", "subsurface scattering", "rim lighting", and "shallow depth-of-field". This produces a more realistic/photographic aesthetic rather than the classic **vibrant Pixar 3D cartoon** style shown in the reference image.

The reference image shows: bright saturated colors, classic Disney Pixar 3D animation (not photo-cinematic), big round expressive eyes, colorful detailed backgrounds (enchanted forest with mushrooms, fireflies), cheerful and playful composition.

## Changes Required

Three edge functions contain the style prompts that need updating:

### 1. `supabase/functions/generate-illustrations/index.ts`

**`generateIllustrationWithFace` (line ~180-194)** — Replace the cinematic portrait style with classic Pixar cartoon style:
- Remove: "cinematic close-up composition", "subsurface scattering", "creamy bokeh", "Octane render quality, 8K masterpiece", "shallow depth-of-field"
- Replace with: "3D Disney Pixar cartoon animation style, vibrant saturated colors, big round expressive eyes with sparkling highlights, smooth stylized skin, cheerful warm lighting, colorful detailed fantasy backgrounds with magical elements"

**`generateIllustration` / `stylePrefix` (line ~276)** — Same style replacement for the no-photo text-to-image path.

### 2. `supabase/functions/generate-cover/index.ts`

**Personalized cover prompt (line ~166-181)** and **fallback Gemini cover prompt (line ~286)** — Same style replacement applied to both cover generation paths.

### 3. `supabase/functions/generate-topic-images/index.ts`

**`TOPIC_PROMPTS` entries** — Replace "High-end cinematic 3D Disney Pixar portrait" / "cinematic golden-hour lighting" / "creamy bokeh" with the matching vibrant cartoon style.

### New Unified Style Prompt

The core style block across all functions will become:

```
3D Disney Pixar cartoon animation style. Vibrant saturated colors, 
big round expressive eyes with sparkling highlights, smooth stylized 
skin, cheerful warm lighting. Characters have exaggerated cute 
proportions with large heads and expressive faces. Colorful detailed 
backgrounds with magical fantasy elements (glowing mushrooms, 
fireflies, sparkles, enchanted forests). Clean sharp rendering, 
rich textures, playful and whimsical atmosphere. 
DO NOT render flat, photorealistic, dark, muted, cinematic bokeh, 
or hyper-realistic styles.
```

The negative prompt will add: "photorealistic, dark, muted colors, cinematic bokeh, hyper-realistic, shallow depth of field"

### Impact

- All new stories will use the classic vibrant Pixar cartoon style matching the reference
- Existing stories are unaffected (already generated)
- No database or schema changes needed
- Three edge functions redeployed

