

## Plan: Fix "No text pages found" for Guest Users

### Root Cause
After the edge function creates the story and pages (using the service role key — bypasses RLS), the **client** tries to verify pages exist by querying `story_pages` directly (line 278). But `story_pages` RLS requires `stories.user_id = auth.uid()`. For guests, both are `NULL`, and `NULL = NULL` is `false` in SQL — so RLS blocks the read, returning zero rows.

### Fix — `src/components/wizard/GeneratingStep.tsx`

Skip the client-side page verification query for guest users. The edge function already confirmed pages were inserted (it would throw on error). Instead, for guests, trust the edge function response and proceed directly to the illustrations phase.

**Lines 278-287** — wrap the verification query in a condition:

```typescript
// For guest users, RLS blocks reading pages (user_id is null),
// so skip client-side verification — trust the edge function response
if (!isGuest) {
  const { data: pages, error: pagesError } = await supabase
    .from("story_pages")
    .select("id, text")
    .eq("story_id", data.storyId)
    .limit(1);
  
  if (pagesError || !pages || pages.length === 0 || !pages[0].text?.trim()) {
    console.error("[GeneratingStep] Story created but no text pages found:", { pagesError, pages });
    throw new Error("הסיפור נוצר אך ללא טקסט. מנסים שוב...");
  }
}
```

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — skip RLS-blocked page verification for guest users

