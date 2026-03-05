

## Problem Analysis

The cover generation sends **6 reference images** (child photo + Sol + Ben + Zoe + Leo + Mia) to Gemini, which dilutes the face reference. The illustration generation sends only **1 reference image** (child photo) with a focused face-matching prompt — that's why illustrations look accurate but the cover doesn't.

Additionally, the cover prompt asks for all 5 supporting characters in one complex composition, which further confuses the model about whose face to prioritize.

## Plan: Align Cover Generation with Illustration Approach

### Changes to `supabase/functions/generate-cover/index.ts`

1. **Simplify the personalized cover to use the same approach as illustrations**: Send only the child's photo as the single reference image (like `generateIllustrationWithFace` does). Remove the 5 supporting character reference images from the personalized cover request.

2. **Use the saved `avatar_description` profile**: Query the child's `avatar_description` from the `children` table (same as illustrations do). Use it to build a precise character description (hair, skin, eyes, outfit) in the text prompt, so the model knows exactly what to render without needing multiple reference images.

3. **Simplify the cover composition**: Instead of asking for 6 characters, the personalized cover should feature **only the child as the hero** in the topic-appropriate setting, with the title text. The supporting cast (Sol, Ben, etc.) can be described in text but not sent as reference images — this prevents face confusion.

4. **Reuse the illustration prompt pattern**: Use the same `FACE REFERENCE` prompt structure from `generateIllustrationWithFace` (lines 173-181 of generate-illustrations) which has proven to produce accurate likenesses.

### Summary of the fix
- **Before**: 6 images sent → model confused about which face to match
- **After**: 1 image (child photo only) → model focuses on the child's face, same as internal illustrations

No other files need changes.

