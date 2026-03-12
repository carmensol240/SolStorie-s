

## Plan: Add 6 New Story Topics

### Overview
Add six new imagination/creativity topics to the "דמיון ויצירה" (creativity) category: Dinosaurs, Cardboard House, Candy Come Alive, Talking Toys, Farm Animals, Unicorn.

### Files to Modify

**1. `src/components/wizard/topic-data.ts`**
- Add 6 new topic entries to the `creativity` section (id: `creativity`, after `strange-inventions`)
- Use placeholder images from the storage bucket (`topic-images/topic-{id}.png`) — these will need to be generated separately
- New topic IDs: `dinosaurs`, `cardboard-house`, `candy-alive`, `talking-toys`, `farm-animals`, `unicorn`

**2. `src/lib/topic-translations.ts`**
- Add 6 new entries to `TOPIC_HEBREW_MAP`:
  - `dinosaurs` → `דינוזאורים`
  - `cardboard-house` → `בית מקרטון`
  - `candy-alive` → `ממתקים שקמו לחיים`
  - `talking-toys` → `צעצועים שמדברים`
  - `farm-animals` → `חיות משק`
  - `unicorn` → `חד קרן`

**3. `supabase/functions/generate-cover/index.ts`**
- Add 6 entries to `TOPIC_SETTINGS` with Pixar-style scene descriptions
- Add corresponding Hebrew → English mappings to `HEBREW_TO_ENGLISH_TOPIC`

### No Database Changes Required
Topics are defined in frontend code; the `stories` table stores the topic ID as free text.

### Illustration Style
All new topics will automatically use the existing Pixar 3D CGI pipeline (Sol cast, same prompts, same art style) — no changes needed to `generate-illustrations` since it uses the story's `illustration_prompt` field, not topic-specific settings.

### Topic Thumbnail Images
The 6 new topics will reference images from the `topic-images` storage bucket. These images will need to be generated after the code changes are deployed.

