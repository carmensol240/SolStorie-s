

## Plan: Personalized Image Generation with Child Photo Reference

### Current State
- **`generate-illustrations`** uses Fal.ai **Flux Schnell** (text-to-image only, no image reference support)
- Character profiles are extracted from photos via Gemini AI → stored as text descriptions → injected into text prompts
- The default "Sol" character reference images are defined but **not actually passed to Flux Schnell** (it doesn't support image inputs)
- **`generate-cover`** uses Gemini image generation with Sol/cast reference images
- **`retry-illustration`** also uses Flux Schnell (text-only)

### Problem
Flux Schnell is a **text-only** model — it cannot accept reference images. The current system converts the child's photo into a text description and hopes the AI recreates the likeness, which produces inconsistent results.

### Solution: Switch to Fal.ai **Flux PuLID** for personalized illustrations

When a child photo exists, use `fal-ai/flux-pulid` instead of `fal-ai/flux/schnell`. PuLID accepts a `reference_image_url` and generates images that preserve the subject's facial identity while following the text prompt.

### Implementation Steps

#### 1. Update `generate-illustrations/index.ts` — Add PuLID path
- Add a new function `generateIllustrationWithFace()` that calls `fal.run/fal-ai/flux-pulid` with:
  ```json
  {
    "prompt": "Personalized character based on reference photo, [Pixar style prefix], [scene], [cast members]",
    "reference_image_url": "<signed child photo URL>",
    "image_size": "portrait_4_3",
    "num_inference_steps": 20,
    "guidance_scale": 4,
    "id_weight": 0.7
  }
  ```
- In the main `generateIllustration()` function, add branching logic:
  - **If `childPhoto` exists** → call `generateIllustrationWithFace()` using PuLID
  - **If no photo** → keep existing Flux Schnell path (text-only with Sol defaults)
- Update the prompt template when a photo is used:
  - Remove Sol character references from the main character
  - Use: `"Personalized character based on the reference image, appearing as [role/action from scene], styled like 3D Disney-Pixar animation, accompanied by [cast members as secondary characters]"`
  - Cast members (Ben, Zoe, Leo, Mia) remain described via text only as secondary characters
- Ensure the child photo URL is a **signed URL** (PuLID needs an accessible HTTP URL, not a base64 string). The existing signed URL logic already handles this.

#### 2. Update `generate-cover/index.ts` — Personalize cover when photo exists
- Before building the cover prompt, check if the story's child has a photo
- Query `children` table for `avatar_url` or `photo_url` using `storyId → stories.child_name + stories.user_id`
- If photo exists: replace Sol in the character references with the child's signed photo URL, and update the prompt to describe the main character as "the child from the reference photo" instead of Sol
- If no photo: keep existing Sol-based cover generation

#### 3. Update `retry-illustration/index.ts` — Add PuLID fallback
- Same branching logic: if child has a photo, use PuLID; otherwise keep Flux Schnell
- Reuse the same `generateIllustrationWithFace()` pattern

#### 4. Prompt Engineering Updates
- When photo is available, the cast hierarchy in prompts changes:
  - Main character: "The child from the reference image" (no Sol)
  - Secondary cast: Ben, Zoe, Leo, Mia described via text (kept smaller/background)
- Add explicit instruction: "The secondary characters must NOT overshadow the main personalized character. The main character should be the focal point of every scene."
- Keep the Visual Anchor system but populate it from the extracted character profile + "matches reference photo"

### Technical Notes
- **Fal.ai PuLID endpoint**: `https://fal.run/fal-ai/flux-pulid` — uses the same `FAL_KEY` already configured
- PuLID is slower than Schnell (~8-15s vs ~2-4s) but produces face-consistent results
- The `id_weight` parameter (0.6-0.8) controls how strongly the face likeness is preserved vs. stylization
- Signed URLs for child photos already exist in the codebase (used in `generate-illustrations` lines 460-508)

### Files to Modify
1. `supabase/functions/generate-illustrations/index.ts` — Main change: add PuLID path + prompt updates
2. `supabase/functions/generate-cover/index.ts` — Personalize cover with child photo
3. `supabase/functions/retry-illustration/index.ts` — Add PuLID fallback for retries

