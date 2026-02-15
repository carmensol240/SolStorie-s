

# Consistent Visual Style for Story Covers

## Overview
Establish a new cover generation system that produces consistent, high-quality 3D Disney-Pixar style covers featuring the 5 SolStories cast characters, with the story title rendered on each cover.

## Current Architecture
- `generate-illustrations` edge function generates page 1 illustration and saves it as `cover_url`
- The cover is just the first page's illustration -- it features the **story's main character** (the user's child), not the cast
- No title text is rendered on any illustration
- The `topic` field on the `stories` table serves as the story name/title

## Proposed Changes

### 1. New Edge Function: `generate-cover`

A dedicated function for cover generation, separate from page illustrations.

**Input:** `storyId`, `title` (Hebrew or English), `topic`, `language` (he/en)

**Logic:**
1. Fetch the story from DB to get topic/theme info
2. Build a cover-specific prompt with:
   - The 5 cast characters (Sol, Mia, Leo, Zoe, Ben) with their exact visual descriptions from the cast definitions
   - A magical, thematic background matched to the story's topic (underwater, space, forest, etc.)
   - 9:16 aspect ratio, 8k resolution, Disney-Pixar 3D style
   - Explicit instruction to render the story title text in a child-friendly font
   - Negative prompt: no UI elements, no buttons, no extra text beyond title
3. Generate image via Lovable AI Gateway (google/gemini-3-pro-image-preview)
4. Upload to `story-illustrations` storage as `{storyId}/cover.png`
5. Update `stories.cover_url` with the new path

**Cover Prompt Template:**
```
In the style of modern 3D Disney-Pixar animation, 8K resolution, soft cinematic lighting, vibrant harmonious colors. 

CHARACTERS (all must appear):
1. Sol - girl ~4yo, warm tan skin, large brown eyes, long wavy dark brown hair in high ponytail with pink band, bright yellow dress
2. Mia - girl in green dress, brown bob cut hair, sometimes with flower crown
3. Leo - boy with black straight hair, round glasses, denim overalls with red-yellow striped shirt, holding a large rainbow pencil
4. Ben - small curly-haired toddler ~3yo, dark brown curly hair, in the center/front
5. Zoe - girl with dark skin, afro hair with light blue headband, purple-yellow tracksuit, holding a soccer ball

SETTING: [theme-specific magical world, e.g., "enchanted underwater coral reef with glowing jellyfish and treasure chests"]

TITLE TEXT: Display "[story title]" prominently in a clear, child-friendly [Hebrew/English] font, integrated naturally into the scene composition.

ASPECT RATIO: 9:16 portrait
EXCLUDE: No UI elements, no buttons, no audio icons, no text beyond the story title.
```

### 2. Update `generate-story/index.ts`

After story text is created and `generate-illustrations` is triggered:
- Also trigger `generate-cover` with the story's topic/title and language
- The cover will be generated in parallel with page illustrations

### 3. Update `generate-illustrations/index.ts`

- Remove the logic that sets page 1 illustration as `cover_url` (lines 592-598)
- The cover is now handled by the dedicated `generate-cover` function

### 4. Update `retry-illustration/index.ts`

- Remove the logic that updates `cover_url` when retrying page 1 (lines 175-180)
- Add a separate "retry cover" capability or endpoint

### 5. Topic-to-Setting Mapping

Create a mapping from story topics to magical cover backgrounds:

| Topic | Cover Setting |
|-------|--------------|
| space-adventure | Cosmic space station with stars, planets, and nebulae |
| bedtime-story | Dreamy cloud kingdom with moonlit sky and floating stars |
| magic-kingdom | Enchanted castle with glowing fairy dust and rainbow bridge |
| zoo-adventure | Magical jungle with friendly glowing animals |
| friendship-courage | Whimsical treehouse village in an enchanted forest |
| body-hero-teeth | Sparkling crystal cave with toothbrush-shaped crystals |
| potty-training | Colorful garden kingdom with stepping stones |
| clean-room | Magical toy workshop with floating toys |
| dentist-visit | Friendly cloud hospital with rainbow bridges |
| new-sibling | Cozy magical nursery with floating stars |
| (default) | Enchanted forest clearing with magical glowing light |

### 6. Title Text Fallback Strategy

Since AI image models sometimes struggle with accurate text rendering:
1. **Primary:** Ask the model to render the title directly in the image
2. **Fallback:** If the model can't render clean text, the frontend could overlay the title text on the cover image using CSS/canvas -- but this would be a future enhancement

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/generate-cover/index.ts` | **Create** - New dedicated cover generation function |
| `supabase/functions/generate-story/index.ts` | **Modify** - Trigger `generate-cover` alongside `generate-illustrations` |
| `supabase/functions/generate-illustrations/index.ts` | **Modify** - Remove cover_url logic from page 1 |
| `supabase/functions/retry-illustration/index.ts` | **Modify** - Remove cover_url update on page 1 retry |
| `supabase/config.toml` | Automatically updated for new function |

## Important Notes

- The cast characters always appear on covers regardless of who the story's main character is
- The main character (the user's child) still appears in page illustrations as before
- The `topic` field is used as the story title on the cover
- The model used will be `google/gemini-3-pro-image-preview` for highest quality cover art
- Hebrew text rendering may not be perfect -- the prompt will prioritize clean composition for potential text overlay fallback

