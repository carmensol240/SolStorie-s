

## Plan: Fix Page 1 Illustration Not Loading

### Root Cause
In `virtualPages` construction, when a DB page's illustration is chosen as the cover illustration (`isCoverIllust === true`):

- **Toddler (0-2) combined pages** (line 1124): `illustrationUrl` is set to `null`, causing the page to show the "generating" palette emoji placeholder forever.
- **Ages 3+ separate pages** (line 1139): the illustration page is entirely skipped, so that illustration never appears in the story flow.

This means the first page's illustration (which is usually selected as the cover) never renders in the story content.

### Fix — `src/pages/StoryViewer.tsx` only

#### 1. Toddler combined pages (line 1124)
Stop nulling the illustration URL for cover pages. Change:
```tsx
illustrationUrl: isCoverIllust ? null : page.illustration_url,
```
to:
```tsx
illustrationUrl: page.illustration_url,
```

#### 2. Ages 3+ illustration pages (line 1139)
Remove the `!isCoverIllust` guard so the illustration page is always included. Change:
```tsx
if (hasIllustration && !isCoverIllust) {
```
to:
```tsx
if (hasIllustration) {
```

### Why this is safe
The cover page (index -1) renders independently using `coverIllustration` data. Showing the same illustration again as part of the story flow is expected behavior — the cover is a preview, and the illustration belongs in its natural story position.

### No other files modified.

