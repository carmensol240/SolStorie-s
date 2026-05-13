## Goal
Make `/story/:slug` viewable by anyone with the link (including logged-out users) by falling back to the `get_public_story` RPC when the direct table query returns no row due to RLS.

## Scope
Single file: `src/pages/StoryViewer.tsx`, inside the existing `fetchStory` flow (around lines 555–650). No other files, no schema changes, no UI changes.

## Change

In `fetchStory`, after the direct `stories` table lookup (UUID branch + slug branch) sets `storyData`, if `storyData` is still `null` and the request is online, attempt the public RPC fallback before triggering the retry/“not found” logic:

```ts
if (!storyData) {
  const { data: publicData } = await supabase.rpc("get_public_story", {
    p_story_id: storyId,
  });
  if (publicData) {
    const pd: any = publicData;
    const resolvedStoryId = pd.id;
    setResolvedId(resolvedStoryId);
    setEditStoryId(resolvedStoryId);
    setGenerationStatus('ready');

    if (pd.slug && storyId !== pd.slug) {
      window.history.replaceState(null, '', `/story/${pd.slug}`);
    }

    const storyObj: Story = {
      id: pd.id,
      slug: pd.slug || undefined,
      child_name: pd.child_name,
      child_gender: pd.child_gender || 'female',
      topic: pd.topic,
      language: pd.language || 'he',
      age_range: pd.age_range || '3-6',
      cover_url: pd.cover_url || undefined,
      pages: (pd.pages || []).map((p: any) => ({
        id: `${pd.id}-${p.page_number}`,
        page_number: p.page_number,
        text: p.text,
        illustration_url: p.illustration_url ?? null,
      })),
      generation_status: 'ready',
    };
    setStory(storyObj);
    setIsLoading(false);
    return; // skip the owner-only story_pages query and series sidebar
  }
  // fall through to existing retry / “not found” handling
}
```

The fallback is placed **before** the `if (!storyData)` retry block so:
- Owner viewing their own story: original path runs unchanged (table query succeeds first).
- Anonymous / non-owner viewer with valid link: RPC returns the story + pages and we render it.
- Truly missing story: RPC returns null → existing 20s retry / "הסיפור לא נמצא" toast still fires.

## Notes
- The existing series-siblings query (`stories` select for the user's other parts) is owner-gated by RLS; it stays unchanged and will simply return nothing for non-owners, which is fine.
- Edit/coloring/PDF actions in `StoryViewer` already require auth+ownership server-side; non-owners just won't be able to use them, matching expected shared-link behavior.
- No DB migration needed — `get_public_story` already exists as `SECURITY DEFINER` and accepts either UUID or slug.
