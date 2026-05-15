## Plan: Apply object-contain to both "תמונה מקורית" thumbnails

The thumbnail labeled `תמונה מקורית` appears in two branches of `ChildInfoStep.tsx`:

1. **Line 760** — already `object-contain` (post-avatar branch). No change.
2. **Line 835** — single-image fallback (before avatar exists), still `object-cover`. **Change to `object-contain`**.

Since the user reports it's still cropping, the visible thumbnail is likely the fallback at line 835. Update only that one className.

### Files touched
- `src/components/wizard/ChildInfoStep.tsx` — line 835: `object-cover` → `object-contain`
