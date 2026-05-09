# Debug demo story RPC failure

## Goal
See exactly what `get_public_story` returns for the demo story so we can stop guessing.

## What I found while exploring

- `src/integrations/supabase/types.ts` shows the generated TS for `get_public_story` is broken:
  ```
  "Could not choose the best candidate function between:
   public.get_public_story(p_story_id => text),
   public.get_public_story(p_story_id => uuid)."
  ```
  Two overloads exist in the DB (text + uuid), and PostgREST cannot resolve which one to call when supabase-js sends `{ p_story_id: "wm25f6" }` over JSON. This very likely returns HTTP 300 "Multiple Choices" / PGRST203 at runtime — which would make both the slug call and the UUID fallback fail for the same reason (the JSON body alone doesn't disambiguate uuid vs text).
- `PublicStoryViewer` works in production today only because that path is hit with slugs and (presumably) was deployed before both overloads existed, OR the same bug is silently affecting it too. Worth confirming with logs, but out of scope for this change.
- Current network snapshot has zero `get_public_story` requests, so we cannot inspect the failing response without instrumentation.

## Change (debug-only, DemoStory only)

File: `src/pages/DemoStory.tsx` — inside `tryFetch` and `fetchStory`:

1. Before each RPC call, `console.log('[DemoStory] RPC call', { id })`.
2. After each call, log the full response:
   `console.log('[DemoStory] RPC response', { id, data, error: rpcError, status: (rpcError as any)?.code, message: (rpcError as any)?.message, details: (rpcError as any)?.details, hint: (rpcError as any)?.hint })`.
3. Log `pages.length` (or `null`) on success.
4. In `fetchStory`, log `final` outcome: which id won, or `both failed`.
5. Add a one-time log at effect start so we can correlate with the network tab.

No changes to UI, RPC signature, RLS, or any other file.

## After logs land
User reloads `/demo-story`, opens DevTools → Console + Network, and shares:
- console output of the `[DemoStory]` lines
- the `/rest/v1/rpc/get_public_story` request: status code, response body, and the request payload

If the response is `PGRST203 / 300 Multiple Choices` (most likely), the real fix will be a separate DB migration to drop the redundant `uuid` overload and keep only the `text` overload (which already handles both via the internal cast). That migration will be proposed in a follow-up plan after we confirm with the logs.

## Out of scope
- Any DB migration.
- Any change to `PublicStoryViewer`, types.ts, or the RPC itself.
- Any UI change.
