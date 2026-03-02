

## Plan: Update All Image Generation Prompts to Enforce Pixar/Disney Cartoon Style

### Current State
The style prompts are already largely aligned with 3D Pixar/Disney style but contain inconsistencies across 6 edge functions. Some prompts mention "soft cinematic lighting" or "8K resolution" which can push models toward semi-realistic output. The core style block needs to be standardized with stronger anti-realism language and explicit "cartoon doll" emphasis inspired by Coco/Encanto.

### Unified Style Block
A single canonical style string will be defined and used across all functions:

```text
3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. 
Characters must look like adorable cartoon dolls — NOT realistic humans. 
Big round expressive cartoon eyes with sparkling highlights, soft rounded 
cute faces, smooth stylized skin with NO pores or texture. Exaggerated cute 
proportions with large heads, small noses, and expressive faces. Vibrant 
rich saturated colors, warm magical golden lighting. Colorful detailed 
backgrounds with magical fantasy elements (glowing mushrooms, fireflies, 
sparkles, enchanted forests). Clean sharp 3D rendering, rich textures, 
playful and whimsical atmosphere. ALWAYS show characters FULL BODY from 
head to toe with feet VISIBLE and GROUNDED. DO NOT render flat, 
photorealistic, semi-realistic, dark, muted, cinematic bokeh, or 
hyper-realistic styles. Characters must NEVER look like real humans or 
photographs — always stylized 3D cartoon dolls.
```

### Files to Edit (6 edge functions)

1. **`supabase/functions/generate-illustrations/index.ts`**
   - Update `generateIllustrationWithFace()` prompt (line ~182) — replace style block and negative prompt
   - Update `generateIllustration()` `stylePrefix` (line ~276) — replace with unified block
   - Update `negativePrompt` (line ~278) — add "realistic, semi-realistic, real human, photograph"
   - Add character consistency instruction: "Maintain IDENTICAL character appearance across all pages — same face shape, same hair, same clothes, same colors"

2. **`supabase/functions/generate-cover/index.ts`**
   - Update personalized cover prompt (line ~166-168) — replace style block
   - Update Gemini fallback cover prompt (line ~286) — replace style block
   - Update negative prompt sections in both paths

3. **`supabase/functions/generate-hero-image/index.ts`**
   - Replace "modern 3D Disney-Pixar animation, 8K resolution, ultra high quality, soft cinematic lighting" (line ~30) with unified style block — remove cinematic/8K references that push toward realism

4. **`supabase/functions/retry-illustration/index.ts`**
   - Update `stylePrefix` (line ~155) — replace with unified block
   - Update `negativePrompt` (line ~157) — add anti-realism terms
   - Update personalized prompt (line ~166-168) — replace style block

5. **`supabase/functions/preview-child-avatar/index.ts`**
   - Update the transform prompt (line ~105-120) — replace "Pixar movie (like 'Coco', 'Inside Out')" with unified style, emphasize cartoon doll look, add "NEVER realistic"

6. **`supabase/functions/generate-topic-images/index.ts`**
   - Update all `TOPIC_PROMPTS` entries — replace "Disney Pixar 3D animation style" with unified style block in each prompt
   - Update `NEGATIVE` constant (line ~11) to include anti-realism terms

### Consistency Enforcement
Add to all illustration prompts (already partially present, needs strengthening):
```text
CRITICAL CHARACTER CONSISTENCY: The main character must look IDENTICAL 
in every illustration — same face shape, same hair color and style, 
same clothing colors, same skin tone, same eye color. Any visual 
deviation between pages is a FAILURE.
```

### No Code Logic Changes
Only prompt text strings are being updated. No architectural or flow changes needed.

