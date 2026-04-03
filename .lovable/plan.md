## Plan: One Free Coloring Page Per Story with Caching

### Overview
Each story gets ONE free AI-generated coloring page. The result is cached in Supabase Storage so subsequent uses (print/online) never call the AI again. If user wants a different illustration colored, show an upsell prompt.

### Database Changes

**New table: `story_coloring_pages`**
```sql
CREATE TABLE public.story_coloring_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_id uuid NOT NULL,
  illustration_url text NOT NULL,
  coloring_image_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.story_coloring_pages ENABLE ROW LEVEL SECURITY;
-- RLS: users see/insert their own, admins see all
```

**Add `coloring_credits` column to `profiles`**
```sql
ALTER TABLE public.profiles ADD COLUMN coloring_credits integer DEFAULT 0;
```
This tracks purchased coloring credits. The first coloring per story is free (no credit needed).

### Edge Function Changes — `generate-coloring-page/index.ts`

1. Accept new param `check_cache: boolean` (optional)
2. Before generating, check `story_coloring_pages` for existing entry for this `story_id + user_id`
3. If cached entry exists:
   - If same illustration_url → return cached image from storage (no AI call)
   - If different illustration_url → check `coloring_credits > 0`. If yes, deduct 1 credit and proceed. If no, return `{ upsell: true }` error
4. If no cached entry → generate (free first use), then:
   - Upload result to `story-illustrations` bucket under `coloring/{story_id}.png`
   - Insert record into `story_coloring_pages`
5. Return the image (base64 or public URL)

### Client Changes — `src/pages/StoryViewer.tsx`

1. On story load, fetch existing `story_coloring_pages` record for this story
2. If cached coloring exists:
   - Skip illustration picker → go straight to choose-action (print/online)
   - Load cached image from storage URL instead of calling edge function
   - Show small "בחרו איור אחר" link that triggers upsell check
3. If no cached coloring exists:
   - Show illustration picker as before (pick ONE)
   - After AI generates, save to cache
4. Handle `upsell: true` response:
   - Show dialog: "רוצים לצבוע איור נוסף? 🎨" with link to upgrade page

### Upgrade Page — `src/pages/Upgrade.tsx`

Update the coloring kit purchase handler to increment `coloring_credits` on the profile (not just record in `purchases`).

### Files Modified
1. Database migration — new `story_coloring_pages` table + `coloring_credits` column
2. `supabase/functions/generate-coloring-page/index.ts` — cache check, storage upload, credit logic
3. `src/pages/StoryViewer.tsx` — cache-aware flow, upsell dialog
4. `src/pages/Upgrade.tsx` — update purchase to increment `coloring_credits`
