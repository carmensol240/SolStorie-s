# Fix: drop redundant `get_public_story(uuid)` overload

## Goal
Resolve PGRST203 by leaving exactly one `get_public_story` function in the database — the `text` overload, which already accepts both slugs and UUID strings via internal cast.

## Migration

```sql
DROP FUNCTION IF EXISTS public.get_public_story(uuid);
```

That's it. The remaining `public.get_public_story(p_story_id text)` is unchanged and already:
- tries to parse the input as UUID first,
- falls back to slug lookup,
- returns the same JSON shape used by `DemoStory.tsx` and `PublicStoryViewer.tsx`,
- is `SECURITY DEFINER` with `EXECUTE` granted to `anon` and `authenticated`.

## Post-migration cleanup (no code changes by us)
- The auto-regenerated `src/integrations/supabase/types.ts` will replace the broken overload union with a single clean signature for `get_public_story`. No client edits required.
- The temporary `console.log` instrumentation added previously to `src/pages/DemoStory.tsx` can stay for one verification reload, then be removed in a follow-up if desired (not part of this plan).

## Out of scope
- No changes to RLS, grants, or any other function.
- No changes to `DemoStory.tsx`, `PublicStoryViewer.tsx`, or any other code.
- No data changes.
