

## Plan: Separate Cover from Page 1 Illustration

### Problem
The `coverIllustration` logic in StoryViewer picks the "best matching" page illustration (usually page 1) and displays it as the cover. After the recent fix that stopped skipping page 1's illustration in the story flow, the same image now appears on both the cover and page 1.

Stories already have a dedicated `cover_url` field (generated separately by `generate-cover` function), so the cover page should use that instead of borrowing a page illustration.

### Fix — `src/pages/StoryViewer.tsx` only

#### 1. Remove the `coverIllustration` useMemo entirely (lines ~1055-1083)
This logic selected a page illustration to use as cover — it's no longer needed since `story.cover_url` exists.

#### 2. Update cover page rendering (lines ~1296-1299)
Change from:
```tsx
src={coverIllustration?.illustration_url 
  ? (getPublicIllustrationUrl(coverIllustration.illustration_url) || story.cover_url || solSuperheroWelcome)
  : (story.cover_url || solSuperheroWelcome)}
```
to:
```tsx
src={story.cover_url || solSuperheroWelcome}
```

#### 3. Remove `isCoverIllust` variable from virtualPages construction (lines ~1101, ~1119)
Since `coverIllustration` no longer exists, remove the `isCoverIllust` variable. The pages already include all illustrations after the previous fix, so no other logic changes are needed.

#### 4. Clean up any remaining references to `coverIllustration`
Remove it from `useMemo` dependencies and any other references.

### Result
- Cover page shows the dedicated cover image (`cover_url`)
- Page 1 shows its own illustration
- No duplicate images

