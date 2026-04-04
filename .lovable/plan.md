

## Plan: Fix Field Name Mismatch — `coloringPageUrl` vs `image`

### Problem
The edge function `generate-coloring-page` returns the coloring image in a field called `image`, but the client code in `StoryViewer.tsx` reads `response.data?.coloringPageUrl` — which is always `undefined`, causing the "No coloring URL returned" error.

Also need to handle the `upsell` response (when user has no coloring credits).

### Solution — single file: `src/pages/StoryViewer.tsx`

Change all 3 occurrences (lines ~1958, ~2002, ~2037) from:
```ts
const coloringUrl = (response.data as any)?.coloringPageUrl;
```
to:
```ts
const coloringUrl = (response.data as any)?.image;
```

Also add handling for the upsell case — when the edge function returns `{ upsell: true }`, show a toast instead of throwing an error.

### What stays the same
- Edge function code (no changes)
- All other coloring logic, canvas, dialog

