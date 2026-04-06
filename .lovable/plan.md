

## Plan: Update Illustration Style to Realistic Pixar/Disney 3D

### Problem
The current style prompts in `style-config.ts` use phrases like "oversized head with small body", "big expressive cartoon eyes", "soft rounded cute features" — which produce chibi/toy-like characters. The user wants realistic Pixar proportions like Inside Out or Encanto.

### Changes — single file: `supabase/functions/_shared/style-config.ts`

**1. Update `PIXAR_STYLE` (line 14)**

Replace:
```
Pixar 3D CGI animation style, big expressive cartoon eyes with sparkling highlights, soft rounded cute features, oversized head with small body, vibrant saturated colors, cinematic warm lighting with glowing accents, fantasy children's book, high quality render, Disney-Pixar aesthetic. NOT realistic.
```

With:
```
Pixar 3D animation style, realistic proportions, warm lighting, detailed hair and skin texture, cinematic quality, Disney-Pixar movie aesthetic like Inside Out or Encanto. Natural skin with subtle pores and warmth, expressive realistic eyes with detailed irises, detailed flowing hair with individual strands visible, warm cinematic soft lighting, rich colorful environment with depth and detail. NOT chibi, NOT toy-like, NOT bobblehead, NOT oversized head.
```

**2. Update `PIXAR_STYLE_COMPACT` (line 16)**

Replace:
```
Pixar 3D CGI animation style, big expressive eyes, soft rounded features, oversized head with small body, vibrant saturated colors, cinematic warm lighting with glowing accents, fantasy children's book background, high quality render, Disney-Pixar animated movie aesthetic. Characters must look like 3D animated movie characters with consistent proportions and features.
```

With:
```
Pixar 3D animation style, realistic proportions, warm lighting, detailed hair and skin texture, cinematic quality, Disney-Pixar movie aesthetic like Inside Out or Encanto. Natural warm skin, expressive realistic eyes, detailed hair, soft cinematic lighting, rich colorful backgrounds. NOT chibi, NOT toy-like, NOT bobblehead.
```

**3. Update `CAST_DESCRIPTIONS` (lines 84-90)**

Remove "big round expressive cartoon eyes" and "oversized head with small body" phrases from each character description. Replace with realistic Pixar descriptions — e.g., "expressive eyes with detailed irises" and "smooth stylized skin" stays but remove "cartoon".

**4. Update `TOPIC_IMAGE_STYLE_SUFFIX` (line 106)**

Same pattern — replace chibi/toy phrasing with realistic Pixar style.

**5. Update `NEGATIVE_PROMPT` and `NEGATIVE_PROMPT_FULL` (lines 26-28)**

Add to negative prompts: `chibi, toy-like, bobblehead, oversized head, doll-like, figurine`

### What stays the same
- All function logic, all other files
- `FULL_BLEED_INSTRUCTION`, `CHARACTER_CONSISTENCY_PROMPT`, `GENDER_SYMBOL_RESTRICTION`
- Character URLs, adventure topics, helper functions
- The `generate-illustrations` edge function code (only the imported style constants change)

### Deploy
After updating `style-config.ts`, deploy all edge functions that import from it: `generate-illustrations`, `generate-topic-images-batch`, `generate-cover`, `generate-hero-image`, `retry-illustration`.

