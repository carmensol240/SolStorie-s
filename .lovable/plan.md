## Goal
In `src/pages/DemoStory.tsx`, if the initial `get_public_story('wm25f6')` (text/slug overload) returns no data or zero pages, retry once with the UUID overload using the known story UUID `a9809104-e088-46f4-810f-0d6d47a9bb24`. Only set the error state if both attempts fail.

## Changes (single file: `src/pages/DemoStory.tsx`)

1. Add a constant: `const DEMO_UUID = "a9809104-e088-46f4-810f-0d6d47a9bb24";`
2. Inside the existing `fetchStory` effect:
   - Call `supabase.rpc("get_public_story", { p_story_id: DEMO_SLUG })` first.
   - If the response has no data, an error, or `pages.length === 0`, call it again with `{ p_story_id: DEMO_UUID }`.
   - Use whichever response yields a valid story with non-empty `pages`.
   - Only set `error=true` if both calls fail or both return empty pages.
   - Keep the `cancelled` cleanup flag and `finally { setLoading(false) }`.
3. Log a `console.warn` when falling back to the UUID overload (helps future debugging).

## Out of scope
No other files. No changes to UI, header, CTA, types, or rendering logic. No RPC or DB changes (the function and grants are already correct on both overloads).
