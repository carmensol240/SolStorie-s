## Goal
Replace the hardcoded demo story in `src/pages/DemoStory.tsx` with the real story `wm25f6` fetched via the existing `get_public_story` RPC, mirroring `PublicStoryViewer`.

## Changes (single file: `src/pages/DemoStory.tsx`)

1. **Imports**: add `useEffect`, `supabase` from `@/integrations/supabase/client`, `Loader2` from lucide-react, and `getPublicIllustrationUrl` from `@/lib/illustration-url`. Remove `DEMO_STORY` import.

2. **Constants**: `const DEMO_SLUG = "wm25f6";`

3. **Types** (local):
   ```ts
   interface DemoPage { page_number: number; text: string; illustration_url: string | null; }
   interface DemoStoryData { id: string; child_name: string; topic: string; age_range: string; cover_url: string | null; pages: DemoPage[]; }
   ```

4. **State**: `story` (DemoStoryData|null), `loading` (true), `error` (false). Keep existing `currentPage`.

5. **Fetch effect**: `supabase.rpc("get_public_story", { p_story_id: DEMO_SLUG })` — same shape as `PublicStoryViewer` (lines 94–108). Set error if no data or empty pages. Use a `cancelled` flag for cleanup.

6. **Render**:
   - Loading: full-screen Loader2 spinner with the existing gradient background.
   - Error: simple message + back-to-home Button.
   - Success: same `BookFrame` / `BookPage` / `NavigationArrows` layout already in the file, but driven by `story.pages`. Resolve illustration via `getPublicIllustrationUrl(page.illustration_url)`. Header title uses `story.topic` (matches PublicStoryViewer). Keep the "סיפור לדוגמה" badge, back button, and the bottom CTA exactly as they are.

## Out of scope
No other files touched. No edits to header chrome, CTA, navigation, auth flow, or `src/data/demo-story.ts` (left intact even though unused).

## Notes
- The `story-illustrations` bucket is public per `src/lib/illustration-url.ts`, so no signed-URL edge function call is needed (simpler than what was discussed earlier).
- `get_public_story` is `SECURITY DEFINER`, so anonymous/non-logged-in visitors can read story `wm25f6`.
