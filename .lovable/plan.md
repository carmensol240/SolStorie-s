

## Plan: Remove Dedicated Cover Page, Show Message on First Illustration

### What changes

Remove the cover page (index `-1`) entirely for all ages. Start all stories at `currentPage = 0`. Overlay the personalized dedication message on top of the first illustration page.

### Changes — `src/pages/StoryViewer.tsx`

**1. Start at page 0 for all ages** (line 192):
```typescript
const [currentPage, setCurrentPage] = useState(0);
```

**2. Remove toddler cover-skip useEffect** (lines 1035-1041): Delete the `toddlerPageFixed` logic — no longer needed since all ages start at 0. Also remove the `toddlerPageFixed` state (line 193).

**3. Update navigation guard** (line 1202): Change `minPage` to always be `0`:
```typescript
if (direction === 'prev' && currentPage <= 0) return;
```

**4. Remove `isCoverPage` logic** (lines 1172, 1270-1301): Delete the `isCoverPage` variable and the entire cover page rendering block (the purple gradient dedication page with "פתחו את הספר" button).

**5. Add dedication overlay on first content page** (inside the content page rendering, around line 1620+): When `currentPage === 0`, overlay the personalized message at the bottom of the illustration:

```tsx
{currentPage === 0 && story && (
  <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
    <p className="text-center text-white text-lg md:text-xl font-bold drop-shadow-lg" dir="rtl">
      הספר הזה נוצר במיוחד עבורך, {story.child_name} 💙
    </p>
  </div>
)}
```

This overlay appears on illustration pages (ages 3+) and combined pages (toddlers) alike — both have an illustration as their first virtual page.

**6. Clean up unused imports**: Remove `RAINBOW_BG` if only used by the cover page. Remove `Sparkles` import if no longer referenced.

### Files modified
1. `src/pages/StoryViewer.tsx` — remove cover page, add dedication overlay on first illustration

