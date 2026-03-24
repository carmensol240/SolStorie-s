

## Plan: Add CHARACTER_CONSISTENCY_PROMPT to All Illustration Prompts

### Problem
The main character looks different across pages — inconsistent hair, face, outfit. While the code has a `visualAnchor` mechanism, the explicit consistency instruction isn't uniformly injected into all generation paths (especially the Gemini face-reference path and Fal.ai fallback).

### Changes

**File 1: `supabase/functions/_shared/style-config.ts`**
- Add a new exported constant `CHARACTER_CONSISTENCY_PROMPT`:
```
export const CHARACTER_CONSISTENCY_PROMPT = "same character throughout all illustrations, consistent appearance, same hair color, same eye color, same face shape, same skin tone, same outfit in every scene. The character must be visually identical across all pages — any deviation is a failure.";
```

**File 2: `supabase/functions/generate-illustrations/index.ts`**
- Import `CHARACTER_CONSISTENCY_PROMPT` from style-config
- **`generateIllustrationWithFace` (line ~163)**: Append `\n\nCHARACTER CONSISTENCY: ${CHARACTER_CONSISTENCY_PROMPT}` to the illustration prompt
- **`generateIllustrationGeminiNoFace` (line ~250)**: Append the same consistency block to the prompt
- **`generateIllustration` (Fal.ai Schnell fallback, line ~347)**: Append the consistency block to `fullPrompt`
- **`buildVisualAnchor` (line ~130)**: Append `CHARACTER_CONSISTENCY_PROMPT` to the anchor text so it's always present

**File 3: `supabase/functions/retry-illustration/index.ts`**
- Import `CHARACTER_CONSISTENCY_PROMPT` from style-config
- Add it to both the Gemini face-reference prompt and the Schnell fallback prompt

### What stays the same
- All other logic: scene analysis, outfit generation, camera angles, upload, DB updates — untouched
- Only prompt text is modified by appending the consistency constant

