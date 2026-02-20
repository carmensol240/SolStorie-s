
# Two UI Changes to TopicStep

## Change 1 — Remove the ℹ️ Icon Button from Topic Tiles

**Problem:** The `Info` button (`<Info className="w-3.5 h-3.5" />`) is currently overlaid on each topic tile image (top-right corner). The user wants to remove it, keeping only the "קרא עוד" link as the way to open the description drawer.

**Fix:** Delete lines 242–248 (the `<button>` with the `Info` icon inside `SimpleTile`). The `<button onClick={() => setShowDrawer(true)}` / "קרא עוד" link at the bottom of the card (lines 259–266) already opens the same drawer, so all functionality is preserved. The `Info` import can also be removed from the import line since it's no longer used.

---

## Change 2 — Category Banner Becomes the "Expand" Toggle (Already Working)

**Current behaviour:** The category banner (`<button onClick={() => toggleSection(section.id)}>` at line 160–172) is already a clickable button that expands/collapses the topics grid. This is exactly what the user is asking for.

**But there's a UX problem:** The banner currently shows only 2 topics by default and the text says "הצג הכל". The user wants to click the banner image (e.g. "גיבורי על", "ערכים", "ארגז כלים") and see ALL related topics open beneath it.

**The existing toggle mechanism already does this** — clicking the banner calls `toggleSection(section.id)` which toggles the `expandedSections` Set, showing all topics. The "הצג הכל" button below is a secondary affordance.

**Enhancement:** Make the banner feel more clearly clickable:
- Add a small visual cue on the banner: a subtle "לחצו לפתיחה" / expand icon hint overlaid at the top-right of each banner when collapsed, and a "▲ סגור" when expanded.
- When the section is already expanded, clicking the banner again collapses it (already works via toggle).
- Remove the separate "הצג הכל (N נושאים)" text button below the grid — the banner itself is now the sole toggle.

---

## Files to Edit

### `src/components/wizard/TopicStep.tsx`

**Line-level changes:**

1. **Line 6** — Remove `Info` from the import (no longer used after removing the button):
   ```ts
   import { ChevronLeft, ChevronUp, Sparkles, Search, X, ChevronDown } from "lucide-react";
   ```

2. **Lines 242–248** — Delete the `Info` button inside `SimpleTile`:
   ```tsx
   {/* Info button — REMOVE THIS BLOCK */}
   <button
     onClick={(e) => { e.stopPropagation(); setShowDrawer(true); }}
     ...
   >
     <Info className="w-3.5 h-3.5" />
   </button>
   ```

3. **Lines 160–172 (Banner button)** — Enhance with an expand/collapse indicator overlaid on the banner image:
   ```tsx
   <button onClick={() => toggleSection(section.id)} ...>
     <div className="relative h-32 w-full">
       <img ... />
       <div className="absolute inset-0" style={{ gradient }} />
       {/* Expand/collapse hint — NEW */}
       <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-[10px] font-bold flex items-center gap-1">
         {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
         {isExpanded ? "סגור" : "פתח"}
       </div>
       {/* Label stays at bottom-center */}
       <div className="absolute inset-0 flex flex-col justify-end items-center pb-3 gap-0.5">
         <h3>...</h3>
         <span>...</span>
       </div>
     </div>
   </button>
   ```

4. **Lines 182–187 (the "הצג הכל" button below the grid)** — Remove it entirely since the banner is now the sole toggle. Keep only the "הצג פחות" collapse button (lines 188–193) or remove both and rely purely on the banner click.

   Actually, since the banner click is the primary UX, we'll remove BOTH the "הצג הכל" and "הצג פחות" text buttons, and let the banner be the only toggle. This makes the interaction cleaner.

---

## Summary of What Changes

| What | Before | After |
|------|--------|-------|
| ℹ️ icon on tiles | Present (top-right of image) | Removed |
| "קרא עוד" link | Present | Stays |
| Category banner | Clickable toggle (already) | Same, plus expand/collapse hint chip |
| "הצג הכל" text button | Below grid | Removed (banner does it) |
| "הצג פחות" text button | Below grid | Removed (banner does it) |

No backend changes. No new dependencies. One file only.
