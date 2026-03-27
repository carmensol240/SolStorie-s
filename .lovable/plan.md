

## Plan: Add "Print Coloring Page" Feature

### 1. New Edge Function: `supabase/functions/generate-coloring-page/index.ts`

- Accepts `illustration_url`, `story_title`, `child_name`
- Downloads the image from `story-illustrations` bucket (public URL)
- Converts to base64, sends to Gemini `google/gemini-2.5-flash` with image editing via Lovable AI Gateway (`google/gemini-2.5-flash-image` model — the image-capable variant)
- Prompt: "Convert this illustration to a children's coloring book page. Black outlines only on white background. Keep lines thick, bold and friendly for a 4-year-old to color. Simplify details. Remove all colors and fills."
- Returns `{ image: "data:image/png;base64,..." }` JSON response
- Standard CORS headers, rate limit error handling (429/402)

### 2. Client-side: Add button to End Page in `src/pages/StoryViewer.tsx`

At lines ~1363-1366 (after the feedback section, before the logo), add:

- State: `coloringLoading`, `coloringImage`
- Button: `🎨 הדפס דף צביעה` with gradient styling matching existing buttons
- On click: calls `generate-coloring-page` with first page's `illustration_url`, `story.topic`, `story.child_name`
- Shows spinner with "יוצר דף צביעה..."
- On success: opens a new print window with an A4 layout containing:
  - Title: `🎨 [story title] – דף צביעה`
  - Coloring image centered
  - Below: `של [child name]` in a playful font
  - SolStories logo at bottom
  - Auto-triggers `window.print()`

### What stays the same
- No changes to any existing edge functions
- No changes to StoryReader or other story page components
- Only additions: new edge function file + button injected into end page section

