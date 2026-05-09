## Goal
Replace the hardcoded demo content in `DemoStory.tsx` with a real, published library story (slug `wm25f6`, verified in DB), fetched via the same RPC the public/library viewer already uses. Keep the page strictly read-only — no edit, print, or audio controls.

## File
`src/pages/DemoStory.tsx` only.

## Changes
1. Drop `import { DEMO_STORY } from "@/data/demo-story"` (file remains, just unused here).
2. Add `useEffect` + `supabase` imports.
3. On mount, fetch the story:
   ```ts
   supabase.rpc("get_public_story", { p_story_id: "wm25f6" })
   ```
   Store `story`, `loading`, `error` in local state. Returned shape: `{ child_name, topic, age_range, language, cover_url, child_gender, pages: [{ page_number, text, illustration_url }] }`.
4. UI states (all inside the existing header + main chrome and gradient background):
   - **Loading:** centered spinner.
   - **Error / no pages:** short Hebrew message "לא ניתן לטעון את הסיפור" with the existing back button.
   - **Success:** reuse the current `BookFrame` + dual-pane layout (illustration left, `BookPage` text right) and `NavigationArrows`. Map fields:
     - `illustrationUrl` → `page.illustration_url`
     - `text` → `page.text`
     - `pageNumber` → `page.page_number`
5. Header title text: use `story.child_name` (e.g. "סול"). Keep the "סיפור לדוגמה" badge as-is.
6. Keep unchanged: RTL wrapper, sticky header, "חזרה" button, gradient background, `BookFrame`/`BookPage`/`NavigationArrows`, and the CTA button to `/create#photo-upload-section`.

## Read-only guarantee
No new buttons or controls are introduced. Specifically: no edit, print, share, audio, coloring, download, or settings controls.

## Out of scope
- `src/data/demo-story.ts` (left in place, unused by this page).
- `BookFrame`, `BookPage`, `NavigationArrows`, `StoryViewer`, `PublicStoryViewer` — untouched.
- Routing, RLS, hooks, styles elsewhere — untouched.
