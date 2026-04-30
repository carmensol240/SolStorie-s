# Fix: Strict gender-appropriate clothing in AI illustrations

## Problem
When the child's gender is "boy", AI-generated illustrations sometimes show the character in dresses or feminine clothing. Current safeguards only cover religious symbols (kippah on girls), not general clothing.

## Approach
Centralize the fix in `supabase/functions/_shared/style-config.ts` — all image-generating edge functions (`generate-cover`, `generate-hero-image`, `generate-illustrations`, `retry-illustration`, `generate-topic-images`, `generate-topic-images-batch`) already import from this file, so a single update propagates everywhere.

## Changes

### 1. `supabase/functions/_shared/style-config.ts`

**a. Strengthen `GENDER_SYMBOL_RESTRICTION`** — rename concept-wise to cover both clothing and symbols. Add explicit clothing rules:

> CRITICAL — GENDER-APPROPRIATE APPEARANCE:
> - If the main character is a BOY: he MUST wear masculine clothing only (pants, shorts, t-shirt, hoodie, sweater, jacket, sneakers/boots). ABSOLUTELY NO dresses, NO skirts, NO tutus, NO feminine hair accessories (no flower crowns, no bows, no hair ribbons), NO makeup, NO purses, NO feminine jewelry. Hair must be a boy's hairstyle (short or medium, no ponytails with ribbons, no buns with flowers).
> - If the main character is a GIRL: NO kippah, NO yarmulke, NO tzitzit, NO male religious clothing or symbols.
> - Clothing, hairstyle, and accessories must clearly match the stated gender in EVERY scene.

**b. Extend `NEGATIVE_PROMPT_FULL`** — append boy-specific negatives so the diffusion model rejects feminine attributes when generating boys:
`boy in dress, boy in skirt, boy wearing tutu, boy with flower crown, boy with bow in hair, boy with makeup, boy in feminine clothing, boy with purse, feminine clothing on boy, dress on male character, skirt on male character`.

(Existing girl-side negatives — kippah/tzitzit/male religious clothing — remain.)

### 2. `supabase/functions/generate-illustrations/index.ts`

In the two scene-prompt builders (lines ~341 and ~1189/1301) and `getCharacterAnchor` (~132), append a one-line gender clothing reminder right after the character description, e.g.:
`This character is a BOY — masculine clothing only, no dresses or skirts.` (or the girl variant when applicable).

This reinforces the centralized rule at the per-scene prompt level where the model is most attentive.

### 3. No client/UI changes
Gender is already passed to all image functions; only prompt strings change.

## Files touched
- `supabase/functions/_shared/style-config.ts` (update `GENDER_SYMBOL_RESTRICTION` + `NEGATIVE_PROMPT_FULL`)
- `supabase/functions/generate-illustrations/index.ts` (3 small inline reminders)

No DB changes, no schema changes, no other functions edited (they auto-inherit via the shared constants).
