

## Plan: Remove Illustration Backgrounds, Use Pure object-cover/object-contain

### Changes — `src/pages/StoryViewer.tsx` only

**1. `handleImageLoad` callback (lines 207-214):**
Remove `img.style.background = 'hsl(260,50%,12%)'` — portrait images get `object-contain` with no background.

**2. Cover image (lines 1246-1250):**
Remove the `background` from inline style. Keep the contain/cover logic for portrait detection.

**3. Combined page illustration (line 1554-1555):**
- className: always `object-cover`, portrait handled by `handleImageLoad` switching to `object-contain`
- Remove `background` from inline style entirely (both learning and non-learning)

**4. Illustration-only page (line 1630-1631):**
Same changes as combined page.

**5. Parent containers** of these images already have `overflow-hidden` via the outer layout — no changes needed there.

### Summary of what changes per location

| Location | Before | After |
|---|---|---|
| `handleImageLoad` | Adds `object-contain` + purple bg | Adds `object-contain` only, no bg |
| Cover img style | `background: hsl(...)` | No background |
| Combined img class | Learning → `object-contain` | Always `object-cover` (portrait handled dynamically) |
| Combined img style | Learning → purple bg | No background |
| Illustration img class | Same as combined | Same fix |
| Illustration img style | Same as combined | Same fix |

No other logic touched.

