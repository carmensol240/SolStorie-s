

## Plan: Fix Learning Story Illustrations to Full Bleed

### Problem
The `SignedImage` in `BookPage.tsx` uses `object-contain` (line 57), which preserves aspect ratio but leaves white margins on the sides.

### Change — `src/components/story/book-frame/BookPage.tsx` line 57

Replace:
```tsx
className="w-full h-full object-contain"
```

With:
```tsx
className="w-full h-full object-cover"
```

Single class change. No other files touched.

