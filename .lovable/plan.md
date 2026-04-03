
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

1. Before generating, check `story_coloring_pages` for existing entry for this `story_id + user_id`
2. If cached entry exists:
   - If same illustration_url: return cached image from storage (no AI call)
   - If different illustration_url: check `coloring_credits > 0`. If yes, deduct 1 credit and proceed. If no, return `{ upsell: true }`
3. If no cached entry: generate (free first use), then:
   - Upload result to `story-illustrations` bucket under `coloring/{story_id}.png`
   - Insert record into `story_coloring_pages`
   - Return the image
4. On subsequent calls with same illustration: serve from storage cache

### Client Changes — `src/pages/StoryViewer.tsx`

1. On coloring button click, fetch existing `story_coloring_pages` record for this story
2. If cached coloring exists:
   - Skip AI call, load cached image from public storage URL
   - Go straight to choose-action (print/online)
   - Show "בחרו איור אחר" that triggers upsell check
3. If no cached coloring: show illustration picker, generate, save to cache
4. Handle `upsell: true` response:
   - Show dialog: "רוצים לצבוע איור נוסף? 🎨" with link to upgrade page

### Upgrade Page — `src/pages/Upgrade.tsx`

Update the coloring kit purchase handler to also increment `coloring_credits` on the profile.

### Files Modified
1. Database migration — new `story_coloring_pages` table + `coloring_credits` column on profiles
2. `supabase/functions/generate-coloring-page/index.ts` — cache check, storage upload, credit deduction
3. `src/pages/StoryViewer.tsx` — cache-aware coloring flow, upsell dialog
4. `src/pages/Upgrade.tsx` — increment `coloring_credits` on purchase
