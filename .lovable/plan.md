

## Analysis

The current `generate-cover/index.ts` has two paths:

1. **Personalized path (lines 160-265)**: Sends only the child's photo — correct approach, matches `generate-illustrations`
2. **Fallback path (lines 270-406)**: When the personalized path fails (Gemini returns no image), it falls back to sending **6 cast character reference images** (Sol, Ben, Zoe, Leo, Mia) — this produces a generic character cover

The bug: Gemini's personalized cover generation sometimes fails (no image returned), and the fallback creates a generic cover with 6 unrelated character references instead of retrying with the child's photo.

## Plan — 3 changes in `supabase/functions/generate-cover/index.ts`

### 1. Remove the 6-image fallback entirely
When a child photo exists but the personalized attempt fails, **retry with the same single-reference approach** using a simplified prompt (no title text, just the child as hero in the setting). Do NOT fall back to cast characters.

### 2. Use the `generate-illustrations` FACE REFERENCE prompt pattern
Replace the personalized cover prompt with the proven structure from `generateIllustrationWithFace` (line 173 of generate-illustrations): `"FACE REFERENCE: The main character's face MUST be an EXACT 3D Pixar rendering of the child in the reference photo..."` — this is the exact wording that produces accurate likenesses.

### 3. Inject `avatar_description` into the prompt
Already fetched at line 106, but strengthen its usage: when available, inject it as explicit character traits (hair, skin, eyes) directly into the FACE REFERENCE block, same pattern as illustrations.

### Fallback for no-photo cases
The cast-based cover (6 images) remains **only** for children without a photo — this is the only scenario where it makes sense.

### Files changed
- `supabase/functions/generate-cover/index.ts` only

