

## Plan: Age-Based Page Layout — Overlay for 0-2, Separate Pages for Older

### Problem
Currently all ages use the same split layout (text page → illustration page). For ages 0-2, text is very short (1-2 sentences), so a dedicated text page feels empty. An overlay on the illustration would be better.

### Changes

#### 1. `src/pages/StoryViewer.tsx` — virtualPages logic (lines ~797-825)

Change the `useMemo` to check `story.age_range`. If age is `0-2`:
- Emit a **single** virtual page of type `'combined'` per DB page (illustration fullscreen + short text overlay)
- Skip creating separate text/illustration pages

For all other ages, keep current behavior (separate text → illustration).

Also update the rendering block (~lines 1074-1151) to handle the new `'combined'` type: fullscreen illustration with a semi-transparent text overlay at the bottom (similar to what's done in PDF export).

#### 2. `src/pages/StoryViewer.tsx` — VirtualPage type

Add `'combined'` to the `type` union in the `VirtualPage` interface.

#### 3. `src/pages/StoryViewer.tsx` — rendering (~line 1074)

Add a case for `currentVirtual.type === 'combined'`:
- Fullscreen illustration as background (`object-cover`)
- Text overlay at bottom: semi-transparent white/pastel bar with the short text, using the existing font size settings
- Page number indicator

#### 4. `src/pages/PublicStoryViewer.tsx` — same changes

Mirror the age-based logic and combined rendering in the public viewer. The `PublicStory` interface already has `age_range`.

### Helper: Age detection

```typescript
const isToddler = story.age_range === '0-2';
```

### No other files need changes

The `BookPage` component is not used by either viewer (they render inline), so no changes needed there.

